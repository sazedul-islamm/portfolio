"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const emptyProjectForm = {
  title: '',
  description: '',
  stack: '',
  liveUrl: '',
  repoUrl: '',
  imageKey: '',
  status: 'draft',
  featured: false,
  sortOrder: 0,
};

function normalizeProjectStatus(status) {
  return String(status ?? '').toLowerCase();
}

function getProjectStatusLabel(status) {
  const normalized = normalizeProjectStatus(status);
  if (normalized === 'published') {
    return 'Published';
  }
  if (normalized === 'in-review') {
    return 'In Review';
  }
  return 'Draft';
}

function getProjectStatusClasses(status) {
  const normalized = normalizeProjectStatus(status);
  if (normalized === 'published') {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (normalized === 'in-review') {
    return 'bg-amber-50 text-amber-700';
  }
  return 'bg-slate-100 text-slate-600';
}

function buildProjectForm(project) {
  return {
    title: project?.title ?? '',
    description: project?.description ?? project?.client ?? '',
    stack: project?.stack ?? project?.category ?? '',
    liveUrl: project?.liveUrl ?? '',
    repoUrl: project?.repoUrl ?? '',
    imageKey: project?.imageKey ?? '',
    status: normalizeProjectStatus(project?.status) || 'draft',
    featured: Boolean(project?.featured),
    sortOrder: Number(project?.sortOrder ?? 0),
  };
}

export default function Projects() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState(emptyProjectForm);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/admin/projects', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load projects');
        }

        if (active) {
          setData(payload);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load projects');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  const projects = useMemo(() => data?.items ?? [], [data]);
  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesTerm =
        !term ||
        [project.title, project.description, project.stack, project.client, project.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === 'all' || normalizeProjectStatus(project.status) === statusFilter;

      return matchesTerm && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(editingId)) ?? null,
    [projects, editingId]
  );

  const metrics = [
    { label: 'Total Projects', value: loading ? '...' : String(data?.summary?.total ?? 0), note: data?.source === 'd1' ? 'Live from D1' : 'Local fallback' },
    { label: 'Published', value: loading ? '...' : String(data?.summary?.published ?? 0), note: 'Visible on portfolio' },
    { label: 'In Review', value: loading ? '...' : String(data?.summary?.inReview ?? 0), note: 'Ready for approval' },
    { label: 'Drafts', value: loading ? '...' : String(data?.summary?.drafts ?? 0), note: 'Needs final review' },
  ];

  const steps = [
    { title: 'Wireframe approved', detail: 'Client signed off on structure and sections.' },
    { title: 'Content refreshed', detail: 'Copy, visuals, and CTA hierarchy updated.' },
    { title: 'SEO ready', detail: 'Metadata and previews validated for launch.' },
  ];

  function handleFieldChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateProject() {
    setEditingId(null);
    setForm(emptyProjectForm);
    setEditorOpen(true);
  }

  function selectProject(project) {
    setEditingId(project.id);
  }

  function openEditProject(project) {
    setEditingId(project.id);
    setForm(buildProjectForm(project));
    setEditorOpen(true);
  }

  function handleEditorOpenChange(nextOpen) {
    setEditorOpen(nextOpen);
    if (!nextOpen) {
      setEditingId(null);
    }
  }

  async function refreshProjects() {
    const response = await fetch('/api/admin/projects', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to reload projects');
    }
    setData(payload);
  }

  async function handleSaveProject(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');

      const endpoint = editingId ? `/api/admin/projects/${editingId}` : '/api/admin/projects';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save project');
      }

      setEditorOpen(false);
      setEditingId(null);
      await refreshProjects();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject(id) {
    const shouldDelete = window.confirm('Delete this project?');
    if (!shouldDelete) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete project');
      }

      if (String(editingId) === String(id)) {
        setEditorOpen(false);
        setEditingId(null);
      }

      await refreshProjects();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Portfolio Content Studio</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold">Projects Management</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              Organize case studies, monitor publication status, and keep your portfolio content polished.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15">
              Preview Portfolio
            </button>
            <button
              type="button"
              onClick={openCreateProject}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Add Project
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-400">{metric.note}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Project Library</h3>
              <p className="mt-1 text-sm text-slate-500">Browse your featured work, publication state, and progress in one place.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search projects"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="in-review">In Review</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.8fr_0.8fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Project</span>
              <span>Category</span>
              <span>Status</span>
              <span>Progress</span>
              <span>Updated</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="px-4 py-6 text-sm text-slate-500">Loading projects...</div>
              ) : filteredProjects.length > 0 ? filteredProjects.map((project) => (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectProject(project)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectProject(project);
                    }
                  }}
                  className="grid cursor-pointer grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.8fr_0.8fr] gap-4 px-4 py-4 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{project.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{project.description || project.client}</p>
                  </div>

                  <div className="flex items-center text-slate-600">{project.stack || project.category || 'Web'}</div>

                  <div className="flex items-center">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getProjectStatusClasses(project.status)}`}>
                      {getProjectStatusLabel(project.status)}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-slate-900" style={{ width: `${project.progress ?? 0}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{project.progress ?? 0}% complete</p>
                    </div>
                  </div>

                  <div className="flex items-center text-slate-500">{project.updated || 'recently'}</div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditProject(project);
                      }}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      disabled={saving}
                      className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )) : (
                <div className="px-4 py-6 text-sm text-slate-500">No projects found yet.</div>
              )}
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Selected Project</h3>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">{selectedProject?.title ?? 'No project selected'}</p>
              <p className="mt-1 text-sm text-slate-500">
                {selectedProject?.description || 'Pick a row to edit it in the popup editor.'}
              </p>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between gap-3">
                  <span>Status</span>
                  <span className="font-medium text-slate-800">{selectedProject ? getProjectStatusLabel(selectedProject.status) : 'Draft'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Stack</span>
                  <span className="font-medium text-slate-800">{selectedProject?.stack || 'Web'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Featured</span>
                  <span className="font-medium text-slate-800">{selectedProject?.featured ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => (selectedProject ? openEditProject(selectedProject) : openCreateProject())}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {selectedProject ? 'Edit Project' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={openCreateProject}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                New Project
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Publishing Workflow</h3>
            <div className="mt-4 space-y-3">
              {steps.map((item, index) => (
                <div key={item.title} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>

      <Sheet open={editorOpen} onOpenChange={handleEditorOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto bg-white p-0 text-slate-900 sm:max-w-2xl">
          <div className="flex min-h-full flex-col">
            <SheetHeader className="border-b border-slate-200 px-6 py-6 text-left">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{editingId ? 'Edit Project' : 'New Project'}</p>
              <SheetTitle className="text-2xl font-semibold text-slate-900">
                {editingId ? 'Update project details' : 'Create a new project'}
              </SheetTitle>
              <SheetDescription className="max-w-xl text-sm text-slate-500">
                Keep the content clean and publication-ready. This popup saves the project into the admin data layer.
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSaveProject} className="flex flex-1 flex-col gap-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
                  <span>Title</span>
                  <input
                    value={form.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
                    placeholder="Project title"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
                  <span>Description</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
                    placeholder="Short summary of the project"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Stack</span>
                  <input
                    value={form.stack}
                    onChange={(e) => handleFieldChange('stack', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
                    placeholder="Next.js, Tailwind, D1"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="in-review">In Review</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Live URL</span>
                  <input
                    value={form.liveUrl}
                    onChange={(e) => handleFieldChange('liveUrl', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
                    placeholder="https://project-demo.com"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Repo URL</span>
                  <input
                    value={form.repoUrl}
                    onChange={(e) => handleFieldChange('repoUrl', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
                    placeholder="https://github.com/..."
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Image Key</span>
                  <input
                    value={form.imageKey}
                    onChange={(e) => handleFieldChange('imageKey', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
                    placeholder="project-image.webp"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Sort Order</span>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => handleFieldChange('sortOrder', Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 md:col-span-2">
                  <span>Featured project</span>
                  <input
                    type="checkbox"
                    checked={Boolean(form.featured)}
                    onChange={(e) => handleFieldChange('featured', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </label>
              </div>

              <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => handleEditorOpenChange(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
