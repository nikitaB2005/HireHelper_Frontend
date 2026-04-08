import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task';
import { ToastService } from '../../services/toast';
import { ReviewService } from '../../services/review';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-tasks.html',
  styleUrls: ['./my-tasks.css']
})
export class MyTasks implements OnInit {
  tasks: any[] = [];
  filteredTasks: any[] = [];

  isLoading = false;
  searchQuery = '';
  selectedStatus = '';
  sortBy = 'latest';
  
  processingTaskIds: Set<number> = new Set();
  pendingDeleteTaskId: number | null = null;

  isEditModalOpen = false;
  editingTask: any = {};
  originalTaskRef: any = null;
  editImageFile: File | null = null;
  editImagePreview: string | null = null;

  isReviewModalOpen = false;
  reviewingTask: any = null;
  reviewForm = { rating: 5, comment: '' };

  constructor(
    private taskService: TaskService, 
    private toast: ToastService, 
    private reviewService: ReviewService
  ) {}

  ngOnInit() {
    this.fetchMyTasks();
  }

  fetchMyTasks() {
    this.isLoading = true;
    this.taskService.getMyTasks().subscribe({
      next: (response: any) => {
        this.tasks = Array.isArray(response) ? response : [];
        this.filterTasks();
        this.isLoading = false;
      },
      error: () => {
        this.tasks = [];
        this.filteredTasks = [];
        this.isLoading = false;
        this.toast.error('Failed to load your tasks.');
      }
    });
  }

  filterTasks() {
    let filtered = [...this.tasks];

    if (this.selectedStatus) {
      filtered = filtered.filter(task => task.status === this.selectedStatus);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        (task.title || '').toLowerCase().includes(query) ||
        (task.description || '').toLowerCase().includes(query) ||
        (task.city || '').toLowerCase().includes(query)
      );
    }

    this.filteredTasks = filtered;
    this.sortTasks();
  }

  sortTasks() {
    switch (this.sortBy) {
      case 'oldest':
        this.filteredTasks.sort(
          (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
        break;
      case 'title':
        this.filteredTasks.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      default:
        this.filteredTasks.sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    }
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.sortBy = 'latest';
    this.filterTasks();
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      open: 'Open',
      in_progress: 'In Progress',
      completed: 'Completed'
    };
    return labels[status] || 'Unknown';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeAgo(dateString: string): string {
    if (!dateString) return '';
    const diffInSeconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return this.formatDate(dateString);
  }

  handleTaskCompletion(task: any) {
    if (!task?.id || this.processingTaskIds.has(task.id)) return;

    if (task.status !== 'in_progress') {
      this.toast.warning('Only in-progress tasks can be completed.');
      return;
    }

    this.processingTaskIds.add(task.id);
    this.taskService.completeTask(task.id).subscribe({
      next: () => {
        task.status = 'completed';
        this.filterTasks();
        this.toast.success(`Task "${task.title}" completed!`);
        this.processingTaskIds.delete(task.id);
      },
      error: (error) => {
        const message = error?.error?.error || 'Failed to complete task.';
        this.toast.error(message);
        this.processingTaskIds.delete(task.id);
      }
    });
  }

  openEditModal(task: any) {
    this.originalTaskRef = task;
    this.editingTask = { ...task };
    this.editImageFile = null;
    this.editImagePreview = task.image || null;
    this.isEditModalOpen = true;
  }

  handleEditImageSelection(event: any) {
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
      this.editImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeEditImage() {
    this.editImageFile = null;
    this.editImagePreview = null;
    this.editingTask.image = null;
  }

  handleTaskUpdate() {
    if (!this.originalTaskRef || !this.editingTask.title) return;
    
    let payload: any;
    // Handle image update or removal via FormData
    if (this.editImageFile || this.editImagePreview === null) {
      payload = new FormData();
      payload.append('title', this.editingTask.title);
      payload.append('description', this.editingTask.description || '');
      payload.append('city', this.editingTask.city || '');
      payload.append('location', this.editingTask.location || '');
      payload.append('start_time', this.editingTask.start_time);
      payload.append('status', this.editingTask.status);
      if (this.editingTask.end_time) {
        payload.append('end_time', this.editingTask.end_time);
      }
      
      if (this.editImageFile) {
        payload.append('image', this.editImageFile);
      } else if (this.editImagePreview === null) {
        payload.append('image', ''); 
      }
    } else {
      // Clean the object payload for non-image updates to avoid sending read-only fields
      // and strings for the image field which causes a 400 Bad Request error.
      const { 
        id, 
        created_by, 
        created_by_id, 
        created_by_rating, 
        created_at, 
        image, 
        ...cleanTask 
      } = this.editingTask;
      
      payload = cleanTask;
    }

    this.taskService.updateTask(this.originalTaskRef.id, payload).subscribe({
      next: (updated: any) => {
        Object.assign(this.originalTaskRef, updated);
        this.toast.success('Task updated successfully.');
        this.filterTasks();
        this.closeEditModal();
      },
      error: (error) => {
        // Log error details for debugging if needed, but show user-friendly message
        console.error('Task update failed:', error);
        const backendErrors = error?.error;
        let errorMessage = 'Failed to update task.';
        
        if (typeof backendErrors === 'object' && backendErrors !== null) {
            // DRF usually returns errors as { field: [error] } or { non_field_errors: [error] }
            const firstErrorKey = Object.keys(backendErrors)[0];
            const errorContent = backendErrors[firstErrorKey];
            errorMessage = Array.isArray(errorContent) ? errorContent[0] : (backendErrors.error || errorMessage);
        }
        
        this.toast.error(errorMessage);
      }
    });
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.originalTaskRef = null;
    this.editingTask = {};
    this.editImageFile = null;
    this.editImagePreview = null;
  }

  initiateTaskDeletion(task: any) {
    this.pendingDeleteTaskId = task.id;
  }

  cancelDeletion() {
    this.pendingDeleteTaskId = null;
  }

  handleTaskDeletion(task: any) {
    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== task.id);
        this.filterTasks();
        this.toast.success('Task deleted successfully.');
        this.cancelDeletion();
      },
      error: (error) => {
        const message = error?.error?.error || 'Failed to delete task.';
        this.toast.error(message);
        this.cancelDeletion();
      }
    });
  }

  openReviewModal(task: any) {
    this.reviewingTask = task;
    this.reviewForm = { rating: 5, comment: '' };
    this.isReviewModalOpen = true;
  }

  closeReviewModal() {
    this.isReviewModalOpen = false;
    this.reviewingTask = null;
  }

  handleReviewSubmission() {
    if (!this.reviewingTask) return;
    this.reviewService.submitReview(this.reviewingTask.id, this.reviewForm.rating, this.reviewForm.comment).subscribe({
      next: () => {
        this.toast.success("Review submitted!");
        this.closeReviewModal();
      },
      error: (error) => {
        this.toast.error(error?.error?.error || "Failed to submit review");
      }
    });
  }
}
