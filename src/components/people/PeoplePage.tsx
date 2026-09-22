import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  ShieldCheck, 
  MoreVertical, 
  Trash2, 
  Pencil,
  Sparkles,
  Phone,
  FileText,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AddPersonModal } from '../modals/AddPersonModal';
import { DeletePersonModal } from '../modals/DeletePersonModal';
import { TrustedPerson } from '../../types';

export const PeoplePage: React.FC = () => {
  const { 
    trustedPeople, 
    deleteTrustedPerson, 
    triggerSimulatedKnown, 
    isTrustedPeopleLoading, 
    refreshTrustedPeople 
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<TrustedPerson | null>(null);
  const [personToDelete, setPersonToDelete] = useState<TrustedPerson | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTrustedPeople();
    setIsRefreshing(false);
  };

  const handleDeleteConfirm = async () => {
    if (!personToDelete) return;
    const personName = personToDelete.name;
    await deleteTrustedPerson(personToDelete.id);
    setPersonToDelete(null);
    showToast(`Removed ${personName} from trusted people.`);
  };

  const filteredPeople = trustedPeople.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.relationship.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          id="people-toast-message"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-zinc-900 px-4 py-3 text-xs font-semibold text-white shadow-xl ring-1 ring-white/10 animate-in slide-in-from-bottom-5 duration-200"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            Trusted People
          </h1>
          <p className="text-xs text-zinc-500">
            Enrolled members SANJAYA recognizes to suppress false alarms and greet safely.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-people-btn"
            onClick={handleRefresh}
            title="Refresh database"
            disabled={isRefreshing || isTrustedPeopleLoading}
            className="rounded-xl border border-zinc-200 bg-white p-2.5 text-zinc-600 shadow-xs hover:bg-zinc-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="add-person-header-btn"
            onClick={() => {
              setPersonToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Person</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          id="search-people-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people by name, relationship, or phone..."
          className="w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-xs"
        />
      </div>

      {/* People List Cards or Empty State */}
      {trustedPeople.length === 0 ? (
        // EXACT EMPTY STATE REQUESTED BY USER
        <div
          id="people-empty-state"
          className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center space-y-3 shadow-xs"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 border border-zinc-200/80">
            <Users className="h-6 w-6" />
          </div>
          <div className="text-base font-bold text-zinc-900">
            No trusted people yet
          </div>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Add people you want SANJAYA to recognize.
          </p>
          <div className="pt-2">
            <button
              id="empty-state-add-person-btn"
              onClick={() => {
                setPersonToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Person</span>
            </button>
          </div>
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center space-y-2 shadow-xs">
          <p className="text-xs text-zinc-500">
            No trusted members match &quot;{searchQuery}&quot;.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-semibold text-zinc-800 hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPeople.map((person) => {
            const initials = person.name
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={person.id}
                id={`person-card-${person.id}`}
                className="relative flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xs hover:border-zinc-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* Photo or Initials Avatar */}
                    <div className="relative h-13 w-13 rounded-full overflow-hidden ring-2 ring-emerald-500/20 shrink-0 bg-zinc-100 flex items-center justify-center">
                      {person.photo_url ? (
                        <img
                          src={person.photo_url}
                          alt={person.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // If remote URL fails to load, gracefully fallback to initials
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs font-bold text-zinc-600">{initials || 'TP'}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-zinc-900 leading-tight">
                        {person.name}
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium">
                        {person.relationship}
                      </p>

                      {person.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 pt-0.5">
                          <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
                          <span>{person.phone}</span>
                        </div>
                      )}

                      {person.notes && (
                        <div className="flex items-start gap-1.5 text-[11px] text-zinc-500 pt-0.5 max-w-xs">
                          <FileText className="h-3 w-3 text-zinc-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{person.notes}</span>
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <ShieldCheck className="h-3 w-3" />
                          Trusted
                        </span>
                        <button
                          onClick={() => triggerSimulatedKnown(person.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-900 transition"
                          title="Simulation Mode: Simulate camera detection for this person"
                        >
                          <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                          <span>Simulate arrival</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Menu (Edit / Delete) */}
                  <div className="relative">
                    <button
                      id={`menu-btn-${person.id}`}
                      onClick={() =>
                        setActiveMenuId(activeMenuId === person.id ? null : person.id)
                      }
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuId === person.id && (
                      <div className="absolute right-0 mt-1 w-44 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg z-20 animate-in fade-in zoom-in-95">
                        <button
                          id={`edit-person-btn-${person.id}`}
                          onClick={() => {
                            setPersonToEdit(person);
                            setIsAddModalOpen(true);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 text-left"
                        >
                          <Pencil className="h-3.5 w-3.5 text-zinc-500" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            triggerSimulatedKnown(person.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 text-left"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          <span>Simulate Arrival</span>
                        </button>

                        <div className="my-1 border-t border-zinc-100" />

                        <button
                          id={`delete-person-btn-${person.id}`}
                          onClick={() => {
                            setPersonToDelete(person);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 text-left font-medium"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Person Modal */}
      {isAddModalOpen && (
        <AddPersonModal
          personToEdit={personToEdit}
          onClose={() => {
            setIsAddModalOpen(false);
            setPersonToEdit(null);
          }}
          onSuccess={(msg) => {
            showToast(msg);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {personToDelete && (
        <DeletePersonModal
          person={personToDelete}
          onCancel={() => setPersonToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};
