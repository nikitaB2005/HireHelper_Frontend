import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TaskService } from '../../services/task';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-task.html',
  styleUrls: ['./add-task.css']
})
export class AddTask {
  private readonly employerStatsKey = 'employerDashboardStats';

  taskData = {
    title: '',
    description: '',
    location: '',
    city: '',
    start_time: '',
    end_time: '',
    status: 'open'
  };

  selectedImage: File | null = null;
  imagePreview: string | null = null;
  isSubmitting = false;

  startTimeError = '';
  endTimeError = '';
  serverErrors: any = {};

  get minDateTime(): string {
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  }

  get minEndDateTime(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const nowStr = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    return this.taskData.start_time > nowStr ? this.taskData.start_time : nowStr;
  }

  constructor(
    private taskService: TaskService,
    private router: Router,
    private toast: ToastService
  ) {}

  handleImageSelection(event: any) {
    const file = event.target.files[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.toast.warning('Image size should not exceed 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        this.toast.warning('Please select a valid image file');
        return;
      }

      this.selectedImage = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  handleStartTimeChange() {
    this.startTimeError = '';
    if (this.taskData.start_time) {
      const start = new Date(this.taskData.start_time);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) {
        this.startTimeError = 'Start date cannot be in the past.';
      }
    }
    
    if (this.taskData.end_time) {
      const start = new Date(this.taskData.start_time);
      const end = new Date(this.taskData.end_time);
      if (end <= start) {
        this.taskData.end_time = '';
        this.endTimeError = 'End date reset: it must be after the start date.';
      } else {
        this.endTimeError = '';
      }
    }
  }

  handleEndTimeChange() {
    this.endTimeError = '';
    const now = new Date();
    now.setSeconds(0, 0);
    
    if (this.taskData.end_time) {
      const end = new Date(this.taskData.end_time);
      if (end < now) {
        this.endTimeError = 'End date & time cannot be in the past.';
        return;
      }
      if (this.taskData.start_time) {
        const start = new Date(this.taskData.start_time);
        if (end <= start) {
          this.endTimeError = 'End date & time must be after the start date & time.';
        }
      }
    }
  }

  handleTaskCreation(taskForm: any) {
    this.serverErrors = {};

    if (taskForm.invalid) {
      Object.keys(taskForm.controls).forEach(key => {
        taskForm.controls[key].markAsTouched();
      });
      this.toast.warning('Please fill in all required fields.');
      return;
    }

    const now = new Date();
    now.setSeconds(0, 0);

    if (!this.taskData.start_time) {
      this.toast.error('Please select a start date.');
      return;
    }

    const start = new Date(this.taskData.start_time);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      this.startTimeError = 'Start date cannot be in the past.';
      this.toast.error(this.startTimeError);
      return;
    }

    if (this.taskData.end_time) {
      const end = new Date(this.taskData.end_time);
      if (end < now) {
        this.endTimeError = 'End date cannot be in the past.';
        this.toast.error(this.endTimeError);
        return;
      }
      if (end <= start) {
        this.endTimeError = 'End date must be after start date.';
        this.toast.error(this.endTimeError);
        return;
      }
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('title', this.taskData.title);
    formData.append('description', this.taskData.description);
    formData.append('location', this.taskData.location);
    formData.append('city', this.taskData.city);
    formData.append('start_time', this.taskData.start_time);
    formData.append('status', this.taskData.status);

    if (this.taskData.end_time) {
      formData.append('end_time', this.taskData.end_time);
    }

    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

    this.taskService.createTask(formData).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.updateStatsCache();
        this.toast.success('Task created successfully');
        this.router.navigate(['/my-tasks']);
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.error && typeof error.error === 'object') {
          this.serverErrors = error.error;
          this.toast.error('Please correct the errors.');
        } else {
          this.toast.error('Failed to create task.');
        }
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'open': 'Open & Active',
      'in_progress': 'Task In Progress',
      'completed': 'Archived & Done'
    };
    return labels[status] || 'Active Task';
  }

  formatPreviewDate(val: string): string {
    if (!val) return '';
    try {
      const date = new Date(val);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'TBD';
    }
  }

  private updateStatsCache() {
    const defaultStats = {
      activeTasks: 0,
      totalHelpers: 0,
      pendingRequests: 0,
      completedTasks: 0,
    };

    try {
      const raw = localStorage.getItem(this.employerStatsKey);
      const stats = raw ? { ...defaultStats, ...JSON.parse(raw) } : defaultStats;

      if (this.taskData.status === 'completed') {
        stats.completedTasks += 1;
      } else {
        stats.activeTasks += 1;
      }

      localStorage.setItem(this.employerStatsKey, JSON.stringify(stats));
    } catch {
      localStorage.setItem(this.employerStatsKey, JSON.stringify({
        activeTasks: this.taskData.status === 'completed' ? 0 : 1,
        totalHelpers: 0,
        pendingRequests: 0,
        completedTasks: this.taskData.status === 'completed' ? 1 : 0,
      }));
    }
  }
}
