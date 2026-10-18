import {
  ArrowLeftRight,
  BadgeCheck,
  Gauge,
  GraduationCap,
  IdCard,
  Landmark,
  Layers,
  Leaf,
  ListChecks,
  ListTodo,
  ListTree,
  MonitorCheck,
  Network,
  Tags,
  UserRound,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import type { NombreIcono } from '../types/proyecto'

// El catálogo guarda el nombre del ícono (texto) porque vive en localStorage.
export const ICONOS: Record<NombreIcono, Component> = {
  ArrowLeftRight,
  BadgeCheck,
  Gauge,
  GraduationCap,
  IdCard,
  Landmark,
  Layers,
  Leaf,
  ListChecks,
  ListTodo,
  ListTree,
  MonitorCheck,
  Network,
  Tags,
  UserRound,
}
