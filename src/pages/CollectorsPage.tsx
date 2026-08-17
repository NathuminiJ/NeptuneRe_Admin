import { Eye, Pencil, Plus, Power } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
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
import { MOCK_COLLECTORS, SYSTEM_DATE } from '../data/mock';
import type { Collector } from '../types';
import { formatDate } from '../utils/format';
import { CollectorFormModal } from './CollectorFormModal';
import type { CollectorFormValues } from './CollectorFormModal';

const PAGE_SIZE = 5;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export function CollectorsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const [collectors, setCollectors] = useState<Collector[]>(MOCK_COLLECTORS);
  const { loading } = useMockLoading();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Collector | null>(null);
  const [pendingToggle, setPendingToggle] = useState<Collector | null>(null);

  // Quick action support: /collectors?new=1 opens the create form.
  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collectors.filter((c) => {
      const matchesSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.loginId.toLowerCase().includes(q) ||
        c.nic.toLowerCase().includes(q) ||
        c.mobile.replace(/[^\d]/g, '').includes(q.replace(/[^\d]/g, ''));
      const matchesStatus = status === 'ALL' || c.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [collectors, search, status]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = (values: CollectorFormValues) => {
    if (editing) {
      setCollectors((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...values } : c)),
      );
      toast.success(`Collector ${editing.fullName} updated`);
    } else {
      const id = `COL-${String(collectors.length + 1).padStart(3, '0')}`;
      const created = new Date().toISOString();
      setCollectors((prev) => [
        ...prev,
        {
          id,
          area: 'Not assigned',
          status: 'ACTIVE',
          createdDate: created,
          lastLogin: null,
          ...values,
        },
      ]);
      toast.success(`Collector ${values.fullName} added`);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (c: Collector) => {
    setEditing(c);
    setFormOpen(true);
  };

  const confirmToggle = () => {
    if (!pendingToggle) return;
    const next = pendingToggle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setCollectors((prev) =>
      prev.map((c) => (c.id === pendingToggle.id ? { ...c, status: next } : c)),
    );
    toast.success(
      next === 'ACTIVE'
        ? `${pendingToggle.fullName} activated`
        : `${pendingToggle.fullName} deactivated`,
    );
    setPendingToggle(null);
  };

  const columns: Column<Collector>[] = [
    {
      key: 'name',
      header: 'Collector',
      render: (c: Collector) => (
        <span className="cell-primary">
          <Avatar name={c.fullName} tone={c.status === 'ACTIVE' ? 'deep' : 'green-100'} />
          <span>
            <span className="cell-title">{c.fullName}</span>
            <div className="cell-sub mono">{c.id}</div>
          </span>
        </span>
      ),
    },
    {
      key: 'loginId',
      header: 'Login ID',
      render: (c: Collector) => <span className="mono">{c.loginId}</span>,
    },
    { key: 'nic', header: 'NIC', render: (c: Collector) => <span className="mono">{c.nic}</span> },
    { key: 'mobile', header: 'Mobile', render: (c: Collector) => c.mobile },
    { key: 'status', header: 'Status', render: (c: Collector) => <StatusBadge status={c.status} /> },
    { key: 'area', header: 'Assignment', render: (c: Collector) => c.area },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      align: 'right',
      render: (c: Collector) => (
        <span className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <IconButton label="View" onClick={() => navigate(`/collectors/${c.id}`)}>
            <Eye size={16} />
          </IconButton>
          <IconButton label="Edit" onClick={() => openEdit(c)}>
            <Pencil size={15} />
          </IconButton>
          <IconButton
            label={c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            danger={c.status === 'ACTIVE'}
            onClick={() => setPendingToggle(c)}
          >
            <Power size={15} />
          </IconButton>
        </span>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <p>{collectors.length} collectors registered · {filtered.length} match your filters</p>
        </div>
        <div className="page-actions">
          <PrimaryButton onClick={openCreate}>
            <Plus size={15} /> Add Collector
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
          placeholder="Search name, login ID, NIC or mobile…"
          label="Search collectors"
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
        {(search || status !== 'ALL') && (
          <button
            type="button"
            className="reset-filter"
            onClick={() => {
              setSearch('');
              setStatus('ALL');
              setPage(1);
            }}
          >
            Reset filters
          </button>
        )}
        <span className="toolbar-spacer" />
        <span className="pagination-info" style={{ fontSize: 12 }}>
          Loaded {formatDate(SYSTEM_DATE)}
        </span>
      </div>

      <div className="table-card">
        <DataTable
          columns={columns}
          rows={pageRows}
          rowKey={(c) => c.id}
          loading={loading}
          onRowClick={(c) => navigate(`/collectors/${c.id}`)}
          emptyState={
            <EmptyState
              icon="inbox"
              title="No collectors found"
              description={
                search || status !== 'ALL'
                  ? 'No collectors match the current search or filters.'
                  : 'No collectors registered yet. Add the first collector to get started.'
              }
              action={
                !search && status === 'ALL' ? (
                  <PrimaryButton onClick={openCreate}>
                    <Plus size={15} /> Add Collector
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

      <CollectorFormModal
        open={formOpen}
        initial={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmationDialog
        open={pendingToggle !== null}
        title={pendingToggle?.status === 'ACTIVE' ? 'Deactivate collector' : 'Activate collector'}
        message={
          pendingToggle?.status === 'ACTIVE'
            ? `${pendingToggle.fullName} (${pendingToggle.loginId}) will be deactivated and will no longer receive assignments.`
            : `${pendingToggle?.fullName} (${pendingToggle?.loginId}) will be re-activated and can receive assignments again.`
        }
        confirmLabel={pendingToggle?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        destructive={pendingToggle?.status === 'ACTIVE'}
        onConfirm={confirmToggle}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}