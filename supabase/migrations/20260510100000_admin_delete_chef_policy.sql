-- Allow admins to delete chef records
CREATE POLICY "Admins can delete chefs" ON public.chefs
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete chef_specialties (cascades automatically, but explicit policy is safer)
CREATE POLICY "Admins can delete chef specialties" ON public.chef_specialties
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
