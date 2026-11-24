CREATE TYPE public.app_role AS ENUM ('admin','transportes','consulta');
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, role public.app_role NOT NULL, UNIQUE(user_id,role));
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
CREATE FUNCTION public.audit_can_read() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid()) $$;
CREATE FUNCTION public.audit_can_write() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'transportes') $$;
CREATE POLICY roles_read ON public.user_roles FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, name text NOT NULL DEFAULT '', team text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY profiles_admin_update ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TABLE public.audit_access_grants (email text PRIMARY KEY, name text NOT NULL DEFAULT '', team text NOT NULL DEFAULT '', role public.app_role NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE ON public.audit_access_grants TO authenticated;
GRANT ALL ON public.audit_access_grants TO service_role;
ALTER TABLE public.audit_access_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY grants_admin ON public.audit_access_grants FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.audit_activate_account() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE account_email text; verified timestamptz; grant_row public.audit_access_grants%ROWTYPE;
BEGIN
 SELECT lower(email),email_confirmed_at INTO account_email,verified FROM auth.users WHERE id=auth.uid();
 IF verified IS NULL THEN RETURN; END IF;
 INSERT INTO public.profiles(id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;
 IF account_email='gedson.garcia@redeancora.com.br' THEN
 INSERT INTO public.user_roles(user_id,role) VALUES(auth.uid(),'admin') ON CONFLICT DO NOTHING;
 ELSE
 SELECT * INTO grant_row FROM public.audit_access_grants WHERE email=account_email AND active;
 IF FOUND THEN
 INSERT INTO public.user_roles(user_id,role) VALUES(auth.uid(),grant_row.role) ON CONFLICT DO NOTHING;
 UPDATE public.profiles SET name=grant_row.name,team=grant_row.team WHERE id=auth.uid();
 END IF;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.audit_activate_account() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.audit_activate_account() TO authenticated;
CREATE FUNCTION public.audit_sync_access() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE account_id uuid;
BEGIN
 SELECT id INTO account_id FROM auth.users WHERE lower(email)=lower(NEW.email) AND email_confirmed_at IS NOT NULL;
 IF lower(NEW.email)='gedson.garcia@redeancora.com.br' THEN RAISE EXCEPTION 'O administrador principal não pode ser alterado por esta operação'; END IF;
 IF account_id IS NOT NULL THEN
 DELETE FROM public.user_roles WHERE user_id=account_id;
 IF NEW.active THEN INSERT INTO public.user_roles(user_id,role) VALUES(account_id,NEW.role); END IF;
 INSERT INTO public.profiles(id,name,team,active) VALUES(account_id,NEW.name,NEW.team,NEW.active) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,team=EXCLUDED.team,active=EXCLUDED.active;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER sync_access AFTER INSERT OR UPDATE ON public.audit_access_grants FOR EACH ROW EXECUTE FUNCTION public.audit_sync_access();
CREATE TABLE public.carriers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legal_name text NOT NULL, cnpj text NOT NULL UNIQUE CHECK(cnpj ~ '^[0-9]{14}$'), display_name text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true, created_by uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE ON public.carriers TO authenticated;
GRANT ALL ON public.carriers TO service_role;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY carriers_read ON public.carriers FOR SELECT TO authenticated USING (public.audit_can_read());
CREATE POLICY carriers_insert ON public.carriers FOR INSERT TO authenticated WITH CHECK (public.audit_can_write());
CREATE POLICY carriers_update ON public.carriers FOR UPDATE TO authenticated USING (public.audit_can_write()) WITH CHECK(public.audit_can_write());
CREATE TABLE public.branches (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL, cnpj text NOT NULL CHECK(cnpj ~ '^[0-9]{14}$'), city text NOT NULL, state text NOT NULL CHECK(state ~ '^[A-Z]{2}$'), address text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY branches_read ON public.branches FOR SELECT TO authenticated USING(public.audit_can_read());
CREATE POLICY branches_insert ON public.branches FOR INSERT TO authenticated WITH CHECK(public.audit_can_write());
CREATE POLICY branches_update ON public.branches FOR UPDATE TO authenticated USING(public.audit_can_write()) WITH CHECK(public.audit_can_write());
CREATE TABLE public.freight_squares (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, state text NOT NULL CHECK(state ~ '^[A-Z]{2}$'), code text NOT NULL UNIQUE, notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE ON public.freight_squares TO authenticated;
GRANT ALL ON public.freight_squares TO service_role;
ALTER TABLE public.freight_squares ENABLE ROW LEVEL SECURITY;
CREATE POLICY squares_read ON public.freight_squares FOR SELECT TO authenticated USING(public.audit_can_read());
CREATE POLICY squares_insert ON public.freight_squares FOR INSERT TO authenticated WITH CHECK(public.audit_can_write());
CREATE POLICY squares_update ON public.freight_squares FOR UPDATE TO authenticated USING(public.audit_can_write()) WITH CHECK(public.audit_can_write());
CREATE TABLE public.freight_table_versions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), carrier_id uuid NOT NULL REFERENCES public.carriers(id), branch_id uuid NOT NULL REFERENCES public.branches(id), square_id uuid REFERENCES public.freight_squares(id), destination text NOT NULL DEFAULT '', valid_from date NOT NULL, valid_until date, commercial jsonb NOT NULL DEFAULT '{}', calculation_rules jsonb NOT NULL DEFAULT '[]', weight_bands jsonb NOT NULL DEFAULT '[]', configuration jsonb NOT NULL DEFAULT '{}', status text NOT NULL DEFAULT 'PENDENTE DE PARAMETRIZAÇÃO', notes text NOT NULL DEFAULT '', previous_version_id uuid REFERENCES public.freight_table_versions(id), created_by uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), CHECK(valid_until IS NULL OR valid_until>=valid_from));
GRANT SELECT,INSERT ON public.freight_table_versions TO authenticated;
GRANT ALL ON public.freight_table_versions TO service_role;
ALTER TABLE public.freight_table_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY versions_read ON public.freight_table_versions FOR SELECT TO authenticated USING(public.audit_can_read());
CREATE POLICY versions_insert ON public.freight_table_versions FOR INSERT TO authenticated WITH CHECK(public.audit_can_write());
CREATE TABLE public.invoice_imports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), file_name text NOT NULL, content_hash text NOT NULL UNIQUE, imported_by uuid NOT NULL DEFAULT auth.uid(), imported_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT ON public.invoice_imports TO authenticated;
GRANT ALL ON public.invoice_imports TO service_role;
ALTER TABLE public.invoice_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY imports_read ON public.invoice_imports FOR SELECT TO authenticated USING(public.audit_can_read());
CREATE POLICY imports_insert ON public.invoice_imports FOR INSERT TO authenticated WITH CHECK(public.audit_can_write());
CREATE TABLE public.invoices (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), import_id uuid NOT NULL REFERENCES public.invoice_imports(id), carrier_id uuid NOT NULL REFERENCES public.carriers(id), number text NOT NULL, issued_on date NOT NULL, due_on date, declared_total numeric(18,4), status text NOT NULL DEFAULT 'PENDENTE DE ASSOCIAÇÃO', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(carrier_id,number));
GRANT SELECT,INSERT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_read ON public.invoices FOR SELECT TO authenticated USING(public.audit_can_read());
CREATE POLICY invoices_insert ON public.invoices FOR INSERT TO authenticated WITH CHECK(public.audit_can_write());
CREATE TABLE public.invoice_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id uuid NOT NULL REFERENCES public.invoices(id), branch_id uuid NOT NULL REFERENCES public.branches(id), cte_key text CHECK(cte_key IS NULL OR cte_key ~ '^[0-9]{44}$'), cte_number text NOT NULL, charged_total numeric(18,4), charged_components jsonb NOT NULL DEFAULT '{}', weight_kg numeric(18,4), source_row jsonb NOT NULL, UNIQUE(invoice_id,branch_id,cte_number));
GRANT SELECT,INSERT ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY items_read ON public.invoice_items FOR SELECT TO authenticated USING(public.audit_can_read());
CREATE POLICY items_insert ON public.invoice_items FOR INSERT TO authenticated WITH CHECK(public.audit_can_write());
CREATE FUNCTION public.audit_import_invoices(payload jsonb) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE batch_id uuid; bill_id uuid; bill jsonb; line jsonb; n integer:=0;
BEGIN
 IF NOT public.audit_can_write() THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
 INSERT INTO public.invoice_imports(file_name,content_hash) VALUES(payload->>'file_name',payload->>'content_hash') RETURNING id INTO batch_id;
 FOR bill IN SELECT * FROM jsonb_array_elements(payload->'invoices') LOOP
 INSERT INTO public.invoices(import_id,carrier_id,number,issued_on,due_on,declared_total) VALUES(batch_id,(bill->>'carrier_id')::uuid,bill->>'number',(bill->>'issued_on')::date,(bill->>'due_on')::date,(bill->>'declared_total')::numeric) RETURNING id INTO bill_id;
 FOR line IN SELECT * FROM jsonb_array_elements(bill->'items') LOOP
 INSERT INTO public.invoice_items(invoice_id,branch_id,cte_key,cte_number,charged_total,charged_components,weight_kg,source_row) VALUES(bill_id,(line->>'branch_id')::uuid,line->>'cte_key',line->>'cte_number',(line->>'charged_total')::numeric,line->'charged_components',(line->>'weight_kg')::numeric,line->'source_row');
 END LOOP;
 n:=n+1;
 END LOOP;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.audit_import_invoices(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.audit_import_invoices(jsonb) TO authenticated;