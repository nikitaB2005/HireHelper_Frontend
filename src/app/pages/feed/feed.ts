import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task';
import { RequestService } from '../../services/request';
import { ToastService } from '../../services/toast';
import { ProfileModalComponent } from '../../components/profile-modal/profile-modal.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileModalComponent],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css']
})
export class Feed implements OnInit {
  private readonly helperStatsKey = 'helperDashboardStats';

  tasks: any[] = [];
  filteredTasks: any[] = [];
  availableCities: string[] = [];
  isLoading = false;

  // Filters
  searchQuery = '';
  selectedCity = '';
  selectedStatus = '';
  sortBy = 'latest'; 

  // Selection
  selectedTaskDetail: any = null;

  // State Tracking
  requestedTaskIds: Set<number> = new Set();
  requestMessages: Record<number, string> = {};

  // Profile Modal State
  isProfileModalOpen = false;
  profileUserId: number | null = null;
  profileUserName = '';
  profileUserRating: number | string | null = null;
  
  get isHirer(): boolean {
    const role = localStorage.getItem('userRole') || 'helper';
    return role.toLowerCase() === 'hirer';
  }

  constructor(
    private taskService: TaskService,
    private requestService: RequestService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.fetchRequestState();
    this.fetchTasks();
  }

  fetchRequestState() {
    this.requestService.getMyRequests().subscribe({
      next: (response: any) => {
        const myRequests = Array.isArray(response) ? response : [];
        
        this.requestedTaskIds = new Set(
          myRequests
            .map((item: any) => item.task_id)
            .filter((taskId: any) => typeof taskId === 'number')
        );

        myRequests.forEach((item: any) => {
          if (typeof item.task_id === 'number') {
            this.requestMessages[item.task_id] = item.message || '';
          }
        });
      },
      error: () => {
        this.requestedTaskIds = new Set();
      }
    });
  }

  fetchTasks() {
    this.isLoading = true;
    this.taskService.getFeed().subscribe({
      next: (response: any) => {
        // Handle both old array format and new paginated object format
        if (response && response.results && Array.isArray(response.results)) {
          this.tasks = response.results;
        } else if (Array.isArray(response)) {
          this.tasks = response;
        } else {
          this.tasks = [];
        }
        
        this.extractCities();
        this.filterTasks();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to load task feed.');
      }
    });
  }

  extractCities() {
    this.availableCities = this.tasks
      .map(task => task.city)
      .filter((city, index, self) => city && self.indexOf(city) === index)
      .sort();
  }

  filterTasks() {
    let filtered = [...this.tasks];

    if (this.selectedCity) {
      filtered = filtered.filter(task => task.city === this.selectedCity);
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(task => task.status === this.selectedStatus);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    this.filteredTasks = filtered;
    this.sortTasks();
  }

  sortTasks() {
    switch (this.sortBy) {
      case 'latest':
        this.filteredTasks.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'oldest':
        this.filteredTasks.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'title':
        this.filteredTasks.sort((a, b) =>
          (a.title || '').localeCompare(b.title || '')
        );
        break;
    }
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCity = '';
    this.selectedStatus = '';
    this.sortBy = 'latest';
    this.filterTasks();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return this.formatDate(dateString);
  }

  isNewTask(dateString: string): boolean {
    const taskDate = new Date(dateString);
    const diffInHours = (new Date().getTime() - taskDate.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };
    return labels[status] || status;
  }

  viewDetails(task: any) {
    this.selectedTaskDetail = task;
  }

  closeModal() {
    this.selectedTaskDetail = null;
  }

  openProfileModal(userId: number, userName: string, rating: number | string | null = null) {
    if (!userId) return;
    this.profileUserId = userId;
    this.profileUserName = userName;
    this.profileUserRating = rating;
    this.isProfileModalOpen = true;
  }

  handleTaskRequest(task: any) {
    if (task.status !== 'open') {
      this.toast.warning('This task is no longer available.');
      return;
    }

    if (this.requestedTaskIds.has(task.id)) {
      this.toast.info('You have already applied for this task.');
      return;
    }

    const message = (this.requestMessages[task.id] || '').trim();

    // Optimistic UI update
    this.requestedTaskIds.add(task.id);
    this.toast.info(`Sending application for "${task.title}"...`);

    this.requestService.sendRequest(task.id, message).subscribe({
      next: () => {
        this.updateHelperStats();
        this.toast.success(`Application sent successfully for "${task.title}".`);
      },
      error: (error) => {
        this.requestedTaskIds.delete(task.id);
        const errorMessage = error?.error?.error || 'Failed to send application.';
        this.toast.error(errorMessage);
      }
    });
  }

  hasRequested(taskId: number): boolean {
    return this.requestedTaskIds.has(taskId);
  }

  private updateHelperStats() {
    const defaultStats = {
      appliedTasks: 0,
      acceptedApplications: 0,
      pendingApplications: 0,
      completedJobs: 0,
    };

    try {
      const raw = localStorage.getItem(this.helperStatsKey);
      const stats = raw ? { ...defaultStats, ...JSON.parse(raw) } : defaultStats;

      stats.appliedTasks += 1;
      stats.pendingApplications += 1;

      localStorage.setItem(this.helperStatsKey, JSON.stringify(stats));
    } catch {
      localStorage.setItem(this.helperStatsKey, JSON.stringify({
        appliedTasks: 1,
        acceptedApplications: 0,
        pendingApplications: 1,
        completedJobs: 0,
      }));
    }
  }
}
