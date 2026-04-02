import { Component, ChangeDetectionStrategy, inject, viewChild } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'

import { Task, UpdateTaskRequest } from '../../../../core/models/task.model'
import { TaskForm, TaskFormValue } from '../task-form/task-form'

interface EditTaskDialogData {
  task: Task
}

@Component({
  selector: 'app-edit-task-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatIconModule, TaskForm],
  styles: [
    `
      :host {
        --mdc-dialog-container-shape: 1.25rem;
      }
      .dialog-accent-bar {
        height: 4px;
        background: linear-gradient(90deg, #4a44c6 0%, #6c63ff 50%, #9d97ff 100%);
      }
    `
  ],
  template: `
    <div class="dialog-accent-bar" aria-hidden="true"></div>

    <h2 mat-dialog-title class="dialog-custom-title">
      <div class="flex items-center gap-3 px-6 pb-4 -mt-6">
        <div
          class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-dark to-primary shadow-[0_4px_12px_rgba(108,99,255,0.35)] shrink-0"
          aria-hidden="true"
        >
          <mat-icon class="!text-white !text-[20px] !w-5 !h-5">edit_note</mat-icon>
        </div>
        <div class="flex flex-col leading-tight">
          <span class="text-lg font-bold text-on-surface">Editar tarea</span>
          <span class="text-xs text-on-surface-secondary"
            >Modifica los campos que desees actualizar</span
          >
        </div>
      </div>
    </h2>

    <mat-dialog-content class="!overflow-x-hidden">
      <app-task-form
        formId="edit-task-form"
        [initialValue]="initialValue"
        (submitted)="onSave($event)"
      />
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
        form="edit-task-form"
        class="inline-flex items-center justify-center gap-2 h-10 px-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none rounded-pill text-sm font-semibold cursor-pointer transition-[box-shadow,transform,opacity] duration-200 shadow-[0_4px_14px_rgba(108,99,255,0.38)] hover:enabled:shadow-[0_6px_22px_rgba(108,99,255,0.52)] hover:enabled:-translate-y-px active:enabled:translate-y-0 active:enabled:shadow-[0_2px_8px_rgba(108,99,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[3px]"
        [disabled]="taskForm().isInvalid()"
      >
        <mat-icon class="!text-[18px] !w-[18px] !h-[18px]" aria-hidden="true">save</mat-icon>
        Guardar cambios
      </button>
    </mat-dialog-actions>
  `
})
export class EditTaskDialog {
  private readonly data = inject<EditTaskDialogData>(MAT_DIALOG_DATA)
  private readonly dialogRef = inject(MatDialogRef<EditTaskDialog>)
  readonly taskForm = viewChild.required(TaskForm)

  readonly initialValue: Partial<TaskFormValue> = {
    title: this.data.task.title,
    description: this.data.task.description,
    priority: (this.data.task.priority as TaskFormValue['priority']) ?? '',
    dueDate: this.data.task.dueDate ? new Date(this.data.task.dueDate) : null
  }

  onSave(value: TaskFormValue): void {
    const original = this.data.task
    const changes: UpdateTaskRequest = {}

    if (value.title !== original.title) changes.title = value.title
    if (value.description !== original.description) changes.description = value.description

    const newPriority = value.priority || undefined
    if (newPriority !== original.priority)
      changes.priority = newPriority as 'low' | 'medium' | 'high' | undefined

    const newDueDate = value.dueDate?.toISOString() ?? null
    if (newDueDate !== (original.dueDate ?? null)) changes.dueDate = newDueDate

    if (Object.keys(changes).length > 0) {
      this.dialogRef.close(changes)
    } else {
      this.dialogRef.close(undefined)
    }
  }

  onCancel(): void {
    this.dialogRef.close(undefined)
  }
}
