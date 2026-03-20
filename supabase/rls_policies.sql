-- =============================================================
-- Row Level Security Policies — Homeschool Tracker
-- Run this once in Supabase SQL Editor after running prisma db push
-- =============================================================

-- Helper function: returns all family_ids the current user belongs to.
-- SECURITY DEFINER lets it read family_memberships even when RLS is active.
CREATE OR REPLACE FUNCTION get_user_family_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT family_id FROM family_memberships WHERE user_id = auth.uid()
$$;

-- =============================================================
-- Enable RLS on all tables
-- =============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_student_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- users — own record only
-- =============================================================
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- =============================================================
-- families — members can read/update their family
-- =============================================================
CREATE POLICY "families_select"
  ON families FOR SELECT
  USING (id IN (SELECT get_user_family_ids()));

CREATE POLICY "families_insert"
  ON families FOR INSERT
  WITH CHECK (true); -- any authenticated user can create a family

CREATE POLICY "families_update"
  ON families FOR UPDATE
  USING (id IN (SELECT get_user_family_ids()));

-- =============================================================
-- family_memberships — members of a family + own row
-- =============================================================
CREATE POLICY "memberships_select"
  ON family_memberships FOR SELECT
  USING (
    family_id IN (SELECT get_user_family_ids())
    OR user_id = auth.uid()
  );

CREATE POLICY "memberships_insert"
  ON family_memberships FOR INSERT
  WITH CHECK (
    family_id IN (SELECT get_user_family_ids())
    OR user_id = auth.uid() -- allow self-join on first login
  );

CREATE POLICY "memberships_delete"
  ON family_memberships FOR DELETE
  USING (family_id IN (SELECT get_user_family_ids()));

-- =============================================================
-- students — scoped to family
-- =============================================================
CREATE POLICY "students_select"
  ON students FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "students_insert"
  ON students FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "students_update"
  ON students FOR UPDATE
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "students_delete"
  ON students FOR DELETE
  USING (family_id IN (SELECT get_user_family_ids()));

-- =============================================================
-- subjects — system subjects (family_id IS NULL) visible to all;
--            custom subjects scoped to family
-- =============================================================
CREATE POLICY "subjects_select"
  ON subjects FOR SELECT
  USING (
    family_id IS NULL
    OR family_id IN (SELECT get_user_family_ids())
  );

CREATE POLICY "subjects_insert"
  ON subjects FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "subjects_update"
  ON subjects FOR UPDATE
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "subjects_delete"
  ON subjects FOR DELETE
  USING (family_id IN (SELECT get_user_family_ids()));

-- =============================================================
-- activity_entries — scoped to family
-- =============================================================
CREATE POLICY "entries_select"
  ON activity_entries FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "entries_insert"
  ON activity_entries FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "entries_update"
  ON activity_entries FOR UPDATE
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "entries_delete"
  ON activity_entries FOR DELETE
  USING (family_id IN (SELECT get_user_family_ids()));

-- =============================================================
-- entry_student_allocations — via parent entry's family
-- =============================================================
CREATE POLICY "allocations_select"
  ON entry_student_allocations FOR SELECT
  USING (
    entry_id IN (
      SELECT id FROM activity_entries
      WHERE family_id IN (SELECT get_user_family_ids())
    )
  );

CREATE POLICY "allocations_insert"
  ON entry_student_allocations FOR INSERT
  WITH CHECK (
    entry_id IN (
      SELECT id FROM activity_entries
      WHERE family_id IN (SELECT get_user_family_ids())
    )
  );

CREATE POLICY "allocations_update"
  ON entry_student_allocations FOR UPDATE
  USING (
    entry_id IN (
      SELECT id FROM activity_entries
      WHERE family_id IN (SELECT get_user_family_ids())
    )
  );

CREATE POLICY "allocations_delete"
  ON entry_student_allocations FOR DELETE
  USING (
    entry_id IN (
      SELECT id FROM activity_entries
      WHERE family_id IN (SELECT get_user_family_ids())
    )
  );

-- =============================================================
-- attachments — scoped to family
-- =============================================================
CREATE POLICY "attachments_select"
  ON attachments FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "attachments_insert"
  ON attachments FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "attachments_update"
  ON attachments FOR UPDATE
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "attachments_delete"
  ON attachments FOR DELETE
  USING (family_id IN (SELECT get_user_family_ids()));

-- =============================================================
-- progress_evaluations — scoped to family
-- =============================================================
CREATE POLICY "evaluations_select"
  ON progress_evaluations FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "evaluations_insert"
  ON progress_evaluations FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "evaluations_update"
  ON progress_evaluations FOR UPDATE
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "evaluations_delete"
  ON progress_evaluations FOR DELETE
  USING (family_id IN (SELECT get_user_family_ids()));

-- =============================================================
-- generated_reports — scoped to family
-- =============================================================
CREATE POLICY "reports_select"
  ON generated_reports FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids()));

CREATE POLICY "reports_insert"
  ON generated_reports FOR INSERT
  WITH CHECK (family_id IN (SELECT get_user_family_ids()));
