import { CalendarDays, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { EmptyState } from '../components/states';
import { FilterDropdown } from '../components/FilterDropdown';
import { IconButton, PrimaryButton } from '../components/buttons';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { SearchBar } from '../components/SearchBar';
import { useToast } from '../context/ToastContext';
import { useMockLoading } from '../hooks';
import { MOCK_ASSIGNMENTS, MOCK_COLLECTORS, SYSTEM_DATE } from '../data/mock';
import type { DailyAssignment } from '../types';
import { formatDate } from '../utils/format';
import { AssignmentFormModal } from './AssignmentFormModal';
import type { AssignmentFormValues } from './AssignmentFormModal';

const PAGE_SIZE = 6;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

const DATE_OPTIONS = [
  { value: 'ALL', label: 'Any Date' },
  { value: 'TODAY', label: 'Today' },
  { value: 'FUTURE', label: 'Upcoming' },
  { value: 'PAST', label: 'Past' },
];

export function AssignmentsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const [assignments, setAssignments] = useState<DailyAssignment[]>(MOCK_ASSIGNMENTS);
  const { loading } = useMockLoading();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DailyAssignment | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DailyAssignment | null>(null);

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const collectorName = (id: string) =>
    MOCK_COLLECTORS.find((c) => c.id === id)?.fullName ?? '—';
  const collectorMobile = (id: string) =>
    MOCK_COLLECTORS.find((c) => c.id === id)?.mobile ?? '—';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignments
      .filter((a) => {
        const matchesSearch =
          !q ||
          a.id.toLowerCase().includes(q) ||
          collectorName(a.collectorId).toLowerCase().includes(q) ||
          a.area.toLowerCase().includes(q);
        const matchesStatus = status === 'ALL' || a.status === status;

        let matchesDate = true;
        if (dateFilter === 'TODAY') matchesDate = a.date === SYSTEM_DATE;
        else if (dateFilter === 'FUTURE') matchesDate = a.date > SYSTEM_DATE;
        else if (dateFilter === 'PAST') matchesDate = a.date < SYSTEM_DATE;

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, search, status, dateFilter]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = (values: AssignmentFormValues) => {
    if (editing) {
      setAssignments((prev) =>
        prev.map((a) => (a.id === editing.id ? { ...a, ...values } : a)),
      );
      toast.success(`Assignment ${editing.id} updated`);
    } else {
      const id = `ASN-${String(1191 + Math.floor(Math.random() * 900) + 1)}`;
      setAssignments((prev) => [
        ...prev,
        {
          id,
          requestIds: [],
          createdDate: new Date().toISOString(),
          ...values,
        },
      ]);
      setPage(1);
      toast.success(`Assignment ${id} created`);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (a: DailyAssignment) => {
    setEditing(a);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setAssignments((prev) => prev.filter((a) => a.id !== pendingDelete.id));
    toast.success(`Assignment ${pendingDelete.id} deleted`);
    setPendingDelete(null);
  };

  const columns: Column<DailyAssignment>[] = [
    {
      key: 'id',
      header: 'Assignment',
      render: (a: DailyAssignment) => (
        <span
          className="cell-primary"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/assignments/${a.id}`)}
        >
          <span className="oct-icon small octagonal oct-light">
            <CalendarDays />
          </span>
          <span>
            <span className="cell-title mono">{a.id}</span>
            <div className="cell-sub">{formatDate(a.date)}</div>
          </span>
        </span>
      ),
    },
    { key: 'collector', header: 'Collector', render: (a: DailyAssignment) => collectorName(a.collectorId) },
    {
      key: 'mobile',
      header: 'Collector Mobile',
      render: (a: DailyAssignment) => (
        <span className="mono" style={{ fontSize: 12.5 }}>
          {collectorMobile(a.collectorId)}
        </span>
      ),
    },
    { key: 'area', header: 'Assigned Area', render: (a: DailyAssignment) => a.area },
    { key: 'status', header: 'Status', render: (a: DailyAssignment) => <StatusBadge status={a.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      align: 'right',
      render: (a: DailyAssignment) => (
        <span className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <IconButton label="View" onClick={() => navigate(`/assignments/${a.id}`)}>
            <Eye size={16} />
          </IconButton>
          <IconButton label="Edit" onClick={() => openEdit(a)}>
            <Pencil size={15} />
          </IconButton>
          <IconButton label="Delete" danger onClick={() => setPendingDelete(a)}>
            <Trash2 size={15} />
          </IconButton>
        </span>
      ),
    },
  ];

  const hasFilters = Boolean(search) || status !== 'ALL' || dateFilter !== 'ALL';

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h2>Daily Assignments</h2>
          <p>{assignments.length} assignments · {filtered.length} match your filters</p>
        </div>
        <div className="page-actions">
          <PrimaryButton onClick={openCreate}>
            <Plus size={15} /> Create Assignment
          </PrimaryButton>
        </div>
      </div>

      <div className="toolbar">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search assignment ID, collector or area…"
          label="Search assignments"
        />
        <FilterDropdown
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <FilterDropdown
          label="Date"
          value={dateFilter}
          options={DATE_OPTIONS}
          onChange={(v) => {
            setDateFilter(v);
            setPage(1);
          }}
        />
        {hasFilters && (
          <button
            type="button"
            className="reset-filter"
            onClick={() => {
              setSearch('');
              setStatus('ALL');
              setDateFilter('ALL');
              setPage(1);
            }}
          >
            Reset filters
          </button>
        )}
      </div>

      <div className="table-card">
        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey={(a) => a.id}
          loading={loading}
          onRowClick={(a) => navigate(`/assignments/${a.id}`)}
          emptyState={
            <EmptyState
              icon="clipboard"
              title="No assignments found"
              description={
                hasFilters
                  ? 'No assignments match the current search or filters.'
                  : 'No assignments yet. Create the first daily assignment to plan collection routes.'
              }
              action={
                !hasFilters ? (
                  <PrimaryButton onClick={openCreate}>
                    <Plus size={15} /> Create Assignment
                  </PrimaryButton>
                ) : undefined
              }
            />
          }
        />
        {!loading && filtered.length > PAGE_SIZE && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
        )}
      </div>

      <AssignmentFormModal
        open={formOpen}
        initial={editing}
        collectors={MOCK_COLLECTORS}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={pendingDelete !== null}
        title="Delete assignment"
        message={`Assignment ${pendingDelete?.id} for ${pendingDelete ? collectorName(pendingDelete.collectorId) : ''} will be permanently removed. Associated collection requests are not deleted.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}