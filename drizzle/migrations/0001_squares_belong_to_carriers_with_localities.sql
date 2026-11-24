-- 1) Praça ligada à transportadora; código deixa de ser obrigatório
ALTER TABLE public.freight_squares
  ADD COLUMN carrier_id uuid REFERENCES public.carriers(id);
ALTER TABLE public.freight_squares ALTER COLUMN code DROP NOT NULL;
CREATE UNIQUE INDEX freight_squares_carrier_state_name_key
  ON public.freight_squares (carrier_id, state, lower(name))
  WHERE carrier_id IS NOT NULL;

-- 2) Localidades de cada praça
CREATE TABLE public.freight_square_localities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  square_id uuid NOT NULL REFERENCES public.freight_squares(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (square_id, name)
);
CREATE INDEX freight_square_localities_square_idx
  ON public.freight_square_localities (square_id);
ALTER TABLE public.freight_square_localities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "square_localities_read" ON public.freight_square_localities
  FOR SELECT TO authenticated USING (public.audit_can_read());
GRANT SELECT ON public.freight_square_localities TO authenticated;
GRANT ALL ON public.freight_square_localities TO service_role;

-- 3) Salva a praça e substitui a lista de localidades numa única operação
CREATE OR REPLACE FUNCTION public.audit_save_square(
  _name text, _state text, _carrier_id uuid, _localities text[]
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sq uuid;
BEGIN
  IF NOT public.audit_can_write() THEN
    RAISE EXCEPTION 'Sem permissão para cadastrar praças' USING ERRCODE = '42501';
  END IF;
  IF coalesce(trim(_name), '') = '' OR _state !~ '^[A-Z]{2}$' OR _carrier_id IS NULL THEN
    RAISE EXCEPTION 'Dados da praça incompletos' USING ERRCODE = '22023';
  END IF;
  IF coalesce(array_length(_localities, 1), 0) = 0 OR array_length(_localities, 1) > 5000 THEN
    RAISE EXCEPTION 'Lista de localidades vazia ou acima de 5000' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO sq FROM public.freight_squares
    WHERE carrier_id = _carrier_id AND state = _state AND lower(name) = lower(trim(_name));
  IF sq IS NULL THEN
    INSERT INTO public.freight_squares (name, state, carrier_id)
    VALUES (trim(_name), _state, _carrier_id) RETURNING id INTO sq;
  END IF;

  DELETE FROM public.freight_square_localities WHERE square_id = sq;
  INSERT INTO public.freight_square_localities (square_id, name, position)
  SELECT sq, trim(l), min(o)::int
    FROM unnest(_localities) WITH ORDINALITY AS t(l, o)
    WHERE trim(l) <> ''
   GROUP BY trim(l);

  RETURN sq;
END $$;
REVOKE ALL ON FUNCTION public.audit_save_square(text, text, uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.audit_save_square(text, text, uuid, text[]) TO authenticated;