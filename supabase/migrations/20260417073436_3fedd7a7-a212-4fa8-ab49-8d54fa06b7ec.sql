CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff TEXT NOT NULL,
  chemical TEXT NOT NULL,
  sample_count INTEGER NOT NULL CHECK (sample_count > 0),
  estimated_hours NUMERIC NOT NULL,
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_date ON public.assignments(assignment_date);
CREATE INDEX idx_assignments_staff ON public.assignments(staff);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view assignments"
ON public.assignments FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert assignments"
ON public.assignments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update assignments"
ON public.assignments FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete assignments"
ON public.assignments FOR DELETE
USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.assignments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;