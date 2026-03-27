import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  assignFileToUsers,
  createPowerBiFile,
  deleteManagedFile,
  downloadManagedFile,
  listManagedFiles,
  listRequests,
  listUsers,
  requestFileAccess,
  updateRequestStatus,
  uploadManagedFile
} from '../api/accessApi';

function StatusBadge({ status, t }) {
  const color =
    status === 'approved'
      ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
      : status === 'rejected'
      ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';

  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${color}`}>{t(status)}</span>;
}

function UserPicker({ users, selectedIds, onToggle, t }) {
  if (!users.length) {
    return <p className="text-xs text-amber-600 dark:text-amber-300">{t('noUsersAvailable')}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedIds.length ? (
          selectedIds.map((id) => {
            const user = users.find((u) => u.id === id);
            if (!user) return null;
            return (
              <span key={id} className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                {user.name}
              </span>
            );
          })
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400">{t('selectUserAssign')}</span>
        )}
      </div>
      <div className="max-h-28 overflow-auto space-y-1 rounded-lg border border-slate-300 p-2 dark:border-slate-700">
        {users.map((u) => (
          <label key={u.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => onToggle(u.id)} />
            {u.name} ({u.role})
          </label>
        ))}
      </div>
    </div>
  );
}

function FileAccessCenter({ user, t }) {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedPowerBi, setSelectedPowerBi] = useState(null);

  const [uploadForm, setUploadForm] = useState({ name: '', file: null, assignTo: [] });
  const [powerForm, setPowerForm] = useState({ name: '', powerBiUrl: '', assignTo: [] });
  const [assignDraft, setAssignDraft] = useState({});

  const isAdmin = user?.role === 'admin';

  const refresh = async () => {
    setLoading(true);
    try {
      const [fileRes, reqRes] = await Promise.all([listManagedFiles(), listRequests()]);
      setFiles(fileRes.files || []);
      setRequests(reqRes.requests || []);
      if (isAdmin) {
        const usersRes = await listUsers();
        setUsers(usersRes.users || []);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || t('failedLoadFileCenter'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const userOptions = useMemo(() => users.filter((u) => u.id !== user.id), [users, user.id]);

  const toggleSelected = (selected, id) => (selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const onUploadFile = async () => {
    if (!uploadForm.file) {
      toast.error(t('selectFileFirst'));
      return;
    }

    const fd = new FormData();
    fd.append('file', uploadForm.file);
    if (uploadForm.name.trim()) fd.append('name', uploadForm.name.trim());
    uploadForm.assignTo.forEach((id) => fd.append('assignTo', id));

    try {
      await uploadManagedFile(fd);
      toast.success(t('fileUploaded'));
      setUploadForm({ name: '', file: null, assignTo: [] });
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || t('uploadFailed'));
    }
  };

  const onCreatePowerBi = async () => {
    if (!powerForm.name.trim() || !powerForm.powerBiUrl.trim()) {
      toast.error(t('provideNameUrl'));
      return;
    }

    try {
      await createPowerBiFile({
        name: powerForm.name.trim(),
        powerBiUrl: powerForm.powerBiUrl.trim(),
        assignTo: powerForm.assignTo
      });
      toast.success(t('dashboardCreated'));
      setPowerForm({ name: '', powerBiUrl: '', assignTo: [] });
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || t('creationFailed'));
    }
  };

  const onRequestAccess = async (fileId) => {
    try {
      await requestFileAccess(fileId);
      toast.success(t('accessRequestSubmitted'));
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || t('failedRequestAccess'));
    }
  };

  const onRequestDecision = async (requestId, status) => {
    try {
      await updateRequestStatus(requestId, status);
      toast.success(t('requestUpdated', { status: t(status) }));
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || t('failedUpdateRequest'));
    }
  };

  const onAssignFile = async (fileId) => {
    const selected = assignDraft[fileId] || [];
    if (!selected.length) {
      toast.error(t('selectAtLeastOneUser'));
      return;
    }

    try {
      await assignFileToUsers(fileId, selected);
      toast.success(t('fileAssigned'));
      setAssignDraft((prev) => ({ ...prev, [fileId]: [] }));
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || t('assignmentFailed'));
    }
  };

  const onDeleteFile = async (fileId) => {
    try {
      await deleteManagedFile(fileId);
      toast.success(t('fileDeleted'));
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || t('deleteFailed'));
    }
  };

  return (
    <section className="space-y-6">
      <div className="glass-card rounded-2xl p-4">
        <h2 className="text-xl font-semibold">{t('fileMgmtTitle')}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {isAdmin ? t('fileMgmtAdminSub') : t('fileMgmtUserSub')}
        </p>
      </div>

      {isAdmin ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold">{t('uploadSection')}</h3>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              placeholder={t('displayNameOptional')}
              value={uploadForm.name}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              type="file"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
            />
            <div className="rounded-lg border border-slate-300 p-3 dark:border-slate-700">
              <p className="text-xs mb-2 text-slate-600 dark:text-slate-300">{t('assignUsers')}</p>
              <UserPicker
                users={userOptions}
                selectedIds={uploadForm.assignTo}
                onToggle={(id) => setUploadForm((prev) => ({ ...prev, assignTo: toggleSelected(prev.assignTo, id) }))}
                t={t}
              />
            </div>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={onUploadFile}>
              {t('uploadFile')}
            </button>
          </div>

          <div className="glass-card rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold">{t('dashboardSection')}</h3>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              placeholder={t('dashboardName')}
              value={powerForm.name}
              onChange={(e) => setPowerForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              placeholder="https://app.powerbi.com/..."
              value={powerForm.powerBiUrl}
              onChange={(e) => setPowerForm((prev) => ({ ...prev, powerBiUrl: e.target.value }))}
            />
            <div className="rounded-lg border border-slate-300 p-3 dark:border-slate-700">
              <p className="text-xs mb-2 text-slate-600 dark:text-slate-300">{t('assignUsers')}</p>
              <UserPicker
                users={userOptions}
                selectedIds={powerForm.assignTo}
                onToggle={(id) => setPowerForm((prev) => ({ ...prev, assignTo: toggleSelected(prev.assignTo, id) }))}
                t={t}
              />
            </div>
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white" onClick={onCreatePowerBi}>
              {t('saveDashboardLink')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold">{t('files')}</h3>
        </div>
        <div className="space-y-3 p-4 md:hidden">
          {files.map((file) => (
            <div key={file.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="font-semibold">{file.name}</p>
              <p className="mt-1 text-xs text-slate-500">{file.type === 'powerbi' ? t('powerBiType') : t('fileType')}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(file.created_at).toLocaleDateString()}</p>
              <div className="mt-2">
                {file.hasAccess || isAdmin ? <StatusBadge status="approved" t={t} /> : <StatusBadge status={file.requestStatus || 'pending'} t={t} />}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(isAdmin || file.hasAccess) && file.type === 'file' ? (
                  <button className="rounded bg-blue-600 px-2 py-1 text-white" onClick={() => downloadManagedFile(file.id, file.original_name || file.name)}>
                    {t('download')}
                  </button>
                ) : null}

                {(isAdmin || file.hasAccess) && file.type === 'powerbi' ? (
                  <button className="rounded bg-indigo-600 px-2 py-1 text-white" onClick={() => setSelectedPowerBi(file.powerbi_url)}>
                    {t('openDashboard')}
                  </button>
                ) : null}

                {!isAdmin && !file.hasAccess ? (
                  <button className="rounded bg-amber-600 px-2 py-1 text-white" onClick={() => onRequestAccess(file.id)}>
                    {t('requestAccess')}
                  </button>
                ) : null}

                {isAdmin ? (
                  <button className="rounded bg-red-600 px-2 py-1 text-white" onClick={() => onDeleteFile(file.id)}>
                    {t('delete')}
                  </button>
                ) : null}
              </div>

              {isAdmin ? (
                <div className="mt-3 space-y-2">
                  <UserPicker
                    users={userOptions}
                    selectedIds={assignDraft[file.id] || []}
                    onToggle={(id) =>
                      setAssignDraft((prev) => ({
                        ...prev,
                        [file.id]: toggleSelected(prev[file.id] || [], id)
                      }))
                    }
                    t={t}
                  />
                  <button className="rounded bg-slate-700 px-2 py-1 text-white" onClick={() => onAssignFile(file.id)}>
                    {t('assign')}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-200/80 dark:bg-slate-800/80">
              <tr>
                <th className="px-4 py-3 text-left">{t('name')}</th>
                <th className="px-4 py-3 text-left">{t('type')}</th>
                <th className="px-4 py-3 text-left">{t('date')}</th>
                <th className="px-4 py-3 text-left">{t('status')}</th>
                <th className="px-4 py-3 text-left">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-4 py-3">{file.name}</td>
                  <td className="px-4 py-3">{file.type === 'powerbi' ? t('powerBiType') : t('fileType')}</td>
                  <td className="px-4 py-3">{new Date(file.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {file.hasAccess || isAdmin ? <StatusBadge status="approved" t={t} /> : <StatusBadge status={file.requestStatus || 'pending'} t={t} />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {(isAdmin || file.hasAccess) && file.type === 'file' ? (
                        <button className="rounded bg-blue-600 px-2 py-1 text-white" onClick={() => downloadManagedFile(file.id, file.original_name || file.name)}>
                          {t('download')}
                        </button>
                      ) : null}

                      {(isAdmin || file.hasAccess) && file.type === 'powerbi' ? (
                        <button className="rounded bg-indigo-600 px-2 py-1 text-white" onClick={() => setSelectedPowerBi(file.powerbi_url)}>
                          {t('openDashboard')}
                        </button>
                      ) : null}

                      {!isAdmin && !file.hasAccess ? (
                        <button className="rounded bg-amber-600 px-2 py-1 text-white" onClick={() => onRequestAccess(file.id)}>
                          {t('requestAccess')}
                        </button>
                      ) : null}

                      {isAdmin ? (
                        <button className="rounded bg-red-600 px-2 py-1 text-white" onClick={() => onDeleteFile(file.id)}>
                          {t('delete')}
                        </button>
                      ) : null}
                    </div>

                    {isAdmin ? (
                      <div className="mt-2 space-y-2">
                        <UserPicker
                          users={userOptions}
                          selectedIds={assignDraft[file.id] || []}
                          onToggle={(id) =>
                            setAssignDraft((prev) => ({
                              ...prev,
                              [file.id]: toggleSelected(prev[file.id] || [], id)
                            }))
                          }
                          t={t}
                        />
                        <button className="rounded bg-slate-700 px-2 py-1 text-white" onClick={() => onAssignFile(file.id)}>
                          {t('assign')}
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold">{isAdmin ? t('requestsInbox') : t('myRequests')}</h3>
        </div>
        <div className="space-y-3 p-4 md:hidden">
          {requests.map((request) => (
            <div key={request.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              {isAdmin ? <p className="text-sm">{request.user?.name || '-'}</p> : null}
              <p className="mt-1 font-semibold">{request.file?.name || '-'}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(request.created_at).toLocaleString()}</p>
              <div className="mt-2"><StatusBadge status={request.status} t={t} /></div>
              {isAdmin ? (
                <div className="mt-3 flex gap-2">
                  <button className="rounded bg-green-600 px-2 py-1 text-white" onClick={() => onRequestDecision(request.id, 'approved')}>
                    {t('approve')}
                  </button>
                  <button className="rounded bg-red-600 px-2 py-1 text-white" onClick={() => onRequestDecision(request.id, 'rejected')}>
                    {t('reject')}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-200/80 dark:bg-slate-800/80">
              <tr>
                {isAdmin ? <th className="px-4 py-3 text-left">{t('user')}</th> : null}
                <th className="px-4 py-3 text-left">{t('file')}</th>
                <th className="px-4 py-3 text-left">{t('date')}</th>
                <th className="px-4 py-3 text-left">{t('status')}</th>
                {isAdmin ? <th className="px-4 py-3 text-left">{t('action')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t border-slate-200 dark:border-slate-800">
                  {isAdmin ? <td className="px-4 py-3">{request.user?.name || '-'}</td> : null}
                  <td className="px-4 py-3">{request.file?.name || '-'}</td>
                  <td className="px-4 py-3">{new Date(request.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={request.status} t={t} /></td>
                  {isAdmin ? (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="rounded bg-green-600 px-2 py-1 text-white" onClick={() => onRequestDecision(request.id, 'approved')}>
                          {t('approve')}
                        </button>
                        <button className="rounded bg-red-600 px-2 py-1 text-white" onClick={() => onRequestDecision(request.id, 'rejected')}>
                          {t('reject')}
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPowerBi ? (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t('powerBiDashboard')}</h3>
            <button className="rounded bg-slate-700 px-3 py-1 text-white" onClick={() => setSelectedPowerBi(null)}>
              {t('close')}
            </button>
          </div>
          <iframe title="Power BI" src={selectedPowerBi} className="h-[500px] w-full rounded-xl border border-slate-300 dark:border-slate-700" />
        </div>
      ) : null}

      {loading ? <p className="text-sm text-slate-600 dark:text-slate-300">{t('refreshing')}</p> : null}
    </section>
  );
}

export default FileAccessCenter;
