import { Component, ChangeDetectionStrategy, inject, viewChild } from '@angular/core'
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'

import { CreateTaskRequest } from '../../../../core/models/task.model'
import { TaskForm, TaskFormValue } from '../task-form/task-form'

@Component({
  selector: 'app-add-task-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatIconModule, TaskForm],
  styles: [
    `
      :host {
        --mdc-dialog-container-shape: 1.25rem;
      }
      .dialog-accent-bar {
        height: 4px;
        background: linear-gradient(90deg, #6c63ff 0%, #9d97ff 60%, #06d6a0 100%);
      }
    `
  ],
  template: `
    <div class="dialog-accent-bar" aria-hidden="true"></div>

    <h2 mat-dialog-title class="dialog-custom-title">
      <div class="flex items-center gap-3 px-6 pb-4 -mt-6">
        <div
          class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-[0_4px_12px_rgba(108,99,255,0.35)] shrink-0"
          aria-hidden="true"
        >
          <mat-icon class="!text-white !text-[20px] !w-5 !h-5">add_task</mat-icon>
        </div>
        <div class="flex flex-col leading-tight">
          <span class="text-lg font-bold text-on-surface">Nueva tarea</span>
          <span class="text-xs text-on-surface-secondary"
            >Completa los campos para registrar tu tarea</span
          >
        </div>
      </div>
    </h2>

    <mat-dialog-content class="!overflow-x-hidden">
      <app-task-form formId="add-task-form" (submitted)="onCreate($event)" />
    </mat-dialog-content>

    <mat-dialog-actions class="!px-6 !py-5 !gap-2.5 !justify-end">
      <button
        type="button"
        class="inline-flex items-center justify-center h-10 px-5 bg-transparent border border-[rgba(108,99,255,0.2)] rounded-lg text-sm font-medium text-on-surface-secondary cursor-pointer transition-all duration-150 hover:bg-[rgba(108,99,255,0.06)] hover:border-primary/40 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        (click)="onCancel()"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="add-task-form"
        class="inline-flex items-center justify-center gap-2 h-10 px-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none rounded-pill text-sm font-semibold cursor-pointer transition-[box-shadow,transform,opacity] duration-200 shadow-[0_4px_14px_rgba(108,99,255,0.38)] hover:enabled:shadow-[0_6px_22px_rgba(108,99,255,0.52)] hover:enabled:-translate-y-px active:enabled:translate-y-0 active:enabled:shadow-[0_2px_8px_rgba(108,99,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[3px]"
        [disabled]="taskForm().isInvalid()"
      >
        <mat-icon class="!text-[18px] !w-[18px] !h-[18px]" aria-hidden="true">check</mat-icon>
        Crear tarea
      </button>
    </mat-dialog-actions>
  `
})
export class AddTaskDialog {
  private readonly dialogRef = inject(MatDialogRef<AddTaskDialog>)
  readonly taskForm = viewChild.required(TaskForm)

  onCreate(value: TaskFormValue): void {
    const payload: CreateTaskRequest = {
      title: value.title,
      description: value.description
    }

    if (value.priority) {
      payload.priority = value.priority
    }
    if (value.dueDate) {
      payload.dueDate = value.dueDate.toISOString()
    }

    this.dialogRef.close(payload)
  }

  onCancel(): void {
    this.dialogRef.close(undefined)
  }
}
