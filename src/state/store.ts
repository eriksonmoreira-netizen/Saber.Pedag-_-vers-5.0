import { Student, SchoolClass, Grade, Occurrence, Tutoring, User, Attendance, Invoice, PlanType } from '../types';
import { MOCK_STUDENTS, MOCK_CLASSES } from '../constants';

class DataStore {
  user: User | null = JSON.parse(localStorage.getItem('saber_user') || 'null');
  students: Student[] = JSON.parse(localStorage.getItem('saber_students') || '[]');
  classes: SchoolClass[] = JSON.parse(localStorage.getItem('saber_classes') || '[]');
  grades: Grade[] = JSON.parse(localStorage.getItem('saber_grades') || '[]');
  occurrences: Occurrence[] = JSON.parse(localStorage.getItem('saber_occurrences') || '[]');
  tutorings: Tutoring[] = JSON.parse(localStorage.getItem('saber_tutorings') || '[]');
  attendances: Attendance[] = JSON.parse(localStorage.getItem('saber_attendances') || '[]');
  invoices: Invoice[] = JSON.parse(localStorage.getItem('saber_invoices') || '[]');
  
  // Cache local de usuários para admin
  registeredUsers: User[] = JSON.parse(localStorage.getItem('saber_all_users') || '[]');
  
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Seed Inicial se vazio
    if (this.classes.length === 0 && !localStorage.getItem('saber_initialized')) {
      console.log('🌱 Seeding initial data...');
      this.students = MOCK_STUDENTS;
      this.classes = MOCK_CLASSES;
      this.persist();
      localStorage.setItem('saber_initialized', 'true');
    }

    // Regra de Ouro: Erikson
    if (this.user && this.user.email === 'erikson.moreira@gmail.com') {
      if (this.user.role !== 'SUPER_ADM' || this.user.plan !== 'GESTOR') {
        this.user.role = 'SUPER_ADM';
        this.user.plan = 'GESTOR';
        this.persist();
      }
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private persist() {
    localStorage.setItem('saber_students', JSON.stringify(this.students));
    localStorage.setItem('saber_classes', JSON.stringify(this.classes));
    localStorage.setItem('saber_grades', JSON.stringify(this.grades));
    localStorage.setItem('saber_occurrences', JSON.stringify(this.occurrences));
    localStorage.setItem('saber_tutorings', JSON.stringify(this.tutorings));
    localStorage.setItem('saber_attendances', JSON.stringify(this.attendances));
    localStorage.setItem('saber_all_users', JSON.stringify(this.registeredUsers));
    localStorage.setItem('saber_invoices', JSON.stringify(this.invoices));
    
    if (this.user) {
      localStorage.setItem('saber_user', JSON.stringify(this.user));
    } else {
      localStorage.removeItem('saber_user');
    }
  }

  private notify() {
    this.persist();
    this.listeners.forEach(l => l());
  }

  // --- ACTIONS ---

  login(userData: User) {
    this.user = userData;
    
    // Adiciona ao registro local se não existir
    if (!this.registeredUsers.find(u => u.email === userData.email)) {
      this.registeredUsers.push(userData);
    }
    
    this.notify();
  }

  logout() {
    this.user = null;
    this.notify();
  }

  // CRUD Classes
  addClass(newClass: SchoolClass) {
    this.classes = [...this.classes, newClass];
    this.notify();
  }

  updateClass(updatedClass: SchoolClass) {
    this.classes = this.classes.map(c => c.id === updatedClass.id ? updatedClass : c);
    this.notify();
  }

  deleteClass(classId: string) {
    this.classes = this.classes.filter(c => c.id !== classId);
    this.notify();
  }

  // CRUD Students & Data
  setAllData(data: any) {
    if(data.students) this.students = data.students;
    if(data.classes) this.classes = data.classes;
    if(data.grades) this.grades = data.grades;
    if(data.occurrences) this.occurrences = data.occurrences;
    if(data.tutorings) this.tutorings = data.tutorings;
    if(data.attendances) this.attendances = data.attendances;
    this.notify();
  }

  saveGrades(newGrades: Grade[]) {
    // Merge simples
    const existingIds = new Set(this.grades.map(g => g.id));
    const toAdd = newGrades.filter(g => !existingIds.has(g.id));
    this.grades = [...this.grades, ...toAdd];
    this.notify();
  }

  saveAttendances(newAttendances: Attendance[]) {
    const existingMap = new Map();
    this.attendances.forEach(a => existingMap.set(`${a.student_id}-${a.date}`, a));
    newAttendances.forEach(a => existingMap.set(`${a.student_id}-${a.date}`, a));
    this.attendances = Array.from(existingMap.values());
    this.notify();
  }

  saveOccurrence(occ: Occurrence) {
    this.occurrences = [occ, ...this.occurrences];
    this.notify();
  }

  saveTutoring(tut: Tutoring) {
    const idx = this.tutorings.findIndex(t => t.id === tut.id);
    if(idx >= 0) this.tutorings[idx] = tut;
    else this.tutorings = [tut, ...this.tutorings];
    this.notify();
  }

  upgradePlan(newPlan: PlanType) {
    if (this.user) {
      this.user.plan = newPlan;
      this.notify();
    }
  }

  // Admin Actions
  addUserBySuperAdm(user: User) {
    this.registeredUsers.push(user);
    this.notify();
  }
  
  updateUserBySuperAdm(id: string, updates: Partial<User>) {
    this.registeredUsers = this.registeredUsers.map(u => u.id === id ? { ...u, ...updates } : u);
    if (this.user?.id === id) {
      this.user = { ...this.user, ...updates } as User;
    }
    this.notify();
  }
  
  deleteUserBySuperAdm(id: string) {
    this.registeredUsers = this.registeredUsers.filter(u => u.id !== id);
    this.notify();
  }
  
  reset() {
    this.students = [];
    this.classes = [];
    this.grades = [];
    this.occurrences = [];
    this.tutorings = [];
    this.attendances = [];
    localStorage.removeItem('saber_initialized');
    this.notify();
  }
}

export const store = new DataStore();