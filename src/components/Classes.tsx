import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, BookOpen, Users, Clock, ChevronRight, School, X, Check, 
  ChevronLeft, Pencil, Trash2, Loader2 
} from 'lucide-react';
import { store } from '../state/store';
import { SchoolClass, GradeCriterion } from '../types';

interface ClassesProps {
  onSelectStudent?: (id: string) => void;
}

export const Classes: React.FC<ClassesProps> = ({ onSelectStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data States
  const [classes, setClasses] = useState(store.classes);
  const [students, setStudents] = useState(store.students);
  
  // UI States
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Form States
  const [newClassName, setNewClassName] = useState('');
  const [newGrade, setNewGrade] = useState(''); 
  const [newSubject, setNewSubject] = useState('');
  const [newSchoolYear, setNewSchoolYear] = useState('2024');
  const [newPeriod, setNewPeriod] = useState<SchoolClass['period']>('matutino');
  const [newGradeCriteria, setNewGradeCriteria] = useState<GradeCriterion[]>([]);

  useEffect(() => {
    return store.subscribe(() => {
      setClasses(store.classes);
      setStudents(store.students);
    });
  }, []);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentCount = (classId: string) => students.filter(s => s.class_id === classId).length;

  const handleOpenEdit = (cls: SchoolClass) => {
    setIsEditMode(true);
    setEditingClassId(cls.id);
    setNewClassName(cls.name);
    setNewGrade(cls.grade || '');
    setNewSubject(cls.subject);
    setNewSchoolYear(cls.school_year);
    setNewPeriod(cls.period);
    setNewGradeCriteria(cls.grade_criteria || []);
    setIsEditModalOpen(true);
  };

  const handleDeleteClass = (classId: string) => {
    if (confirm('Tem certeza que deseja excluir esta turma?')) {
      store.deleteClass(classId);
    }
  };

  const handleSaveClass = async () => {
    if (!newClassName) {
      alert("Nome da turma é obrigatório.");
      return;
    }

    setIsSaving(true);
    // Simular delay para UX
    await new Promise(r => setTimeout(r, 600));

    const classData: SchoolClass = {
      id: isEditMode && editingClassId ? editingClassId : `class-${Date.now()}`,
      name: newClassName,
      grade: newGrade,
      subject: newSubject,
      school_year: newSchoolYear,
      period: newPeriod,
      school_name: 'Minha Escola',
      color: 'indigo',
      status: 'ativa',
      grade_criteria: newGradeCriteria,
      created_by: store.user?.email
    };

    if (isEditMode) {
      store.updateClass(classData);
    } else {
      store.addClass(classData);
    }

    setIsSaving(false);
    setIsEditModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setIsEditMode(false);
    setEditingClassId(null);
    setNewClassName('');
    setNewGrade('');
    setNewSubject('');
    setNewSchoolYear('2024');
    setNewPeriod('matutino');
    setNewGradeCriteria([]);
  };

  // --- Renderização: Detalhes da Turma ---
  if (selectedClassId && selectedClass) {
    const classStudents = students.filter(s => s.class_id === selectedClassId);
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-12">
        <button 
          onClick={() => setSelectedClassId(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar para Turmas
        </button>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-lg`}>
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedClass.name}</h2>
                <button onClick={() => handleOpenEdit(selectedClass)} className="p-2 bg-slate-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
                {selectedClass.subject} • {selectedClass.period}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 text-center">
            <h3 className="text-xl font-bold text-slate-700 mb-2">Lista de Alunos</h3>
            <p className="text-slate-500 text-sm">Em breve: Visualização detalhada dos alunos desta turma.</p>
            <p className="text-indigo-600 font-bold mt-4">{classStudents.length} Alunos cadastrados</p>
        </div>
      </div>
    );
  }

  // --- Renderização: Lista de Cards ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Turmas</h1>
          <p className="text-slate-500 font-medium">Gerencie suas salas de aula.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { resetForm(); setIsEditModalOpen(true); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" /> Nova Turma
          </button>
        </div>
      </div>

      <div className="relative bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-w-md">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar turma..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredClasses.length > 0 ? filteredClasses.map((c) => (
            <div 
              key={c.id} 
              onClick={() => setSelectedClassId(c.id)}
              className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative"
            >
              <div className="bg-indigo-600 h-24 p-6 relative">
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(c); }}
                    className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-all backdrop-blur-sm"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }}
                    className="p-2 bg-white/20 hover:bg-red-500/80 rounded-lg text-white transition-all backdrop-blur-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <BookOpen className="w-8 h-8 text-white/50 absolute bottom-4 right-4" />
                <h3 className="text-xl font-bold text-white truncate pr-8">{c.name}</h3>
                <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{c.subject}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Users className="w-4 h-4" /> {getStudentCount(c.id)} Alunos
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 font-medium capitalize">
                    <Clock className="w-4 h-4" /> {c.period}
                  </div>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400">{c.school_year}</span>
                  <div className="text-indigo-600 font-black text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                    Ver Detalhes <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
            <div className="max-w-xs mx-auto space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <School className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Nenhuma turma encontrada</h3>
              <button onClick={() => setIsEditModalOpen(true)} className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-all text-sm">
                Criar Primeira Turma
              </button>
            </div>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-2xl font-black text-slate-900">{isEditMode ? 'Editar Turma' : 'Nova Turma'}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nome da Turma *</label>
                  <input type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Ex: 9º Ano A" className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Disciplina</label>
                  <input type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Ex: Matemática" className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Período</label>
                  <select value={newPeriod} onChange={(e) => setNewPeriod(e.target.value as any)} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none">
                    <option value="matutino">Matutino</option>
                    <option value="vespertino">Vespertino</option>
                    <option value="noturno">Noturno</option>
                    <option value="integral">Integral</option>
                  </select>
                </div>
            </div>
            <div className="p-8 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all">Cancelar</button>
              <button onClick={handleSaveClass} disabled={isSaving} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {isEditMode ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};