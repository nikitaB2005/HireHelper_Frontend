import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { TaskService } from '../../services/task';
import { RequestService } from '../../services/request';
import { NotificationService } from '../../services/notification';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly employerStatsKey = 'employerDashboardStats';
  private readonly helperStatsKey = 'helperDashboardStats';

  private taskService = inject(TaskService);
  private requestService = inject(RequestService);
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);

  userRole = 'HELPER';
  userName = 'User';

  unreadNotificationCount = 0;
  private notificationPollId: any = null;
  private statsPollId: any = null;
  
  private knownNotificationIds = new Set<number>();
  private isInitialLoadDone = false;

  // Employer Stats
  activeTaskCount = 0;
  totalHelperCount = 0;
  pendingRequestCount = 0;
  completedTaskCount = 0;

  // Helper Stats
  appliedTaskCount = 0;
  acceptedApplicationCount = 0;
  pendingApplicationCount = 0;
  completedJobCount = 0;

  get isEmployer(): boolean {
    return this.userRole === 'HIRER' || this.userRole === 'EMPLOYER';
  }

  get isHelper(): boolean {
    return this.userRole === 'HELPER';
  }

  ngOnInit(): void {
    this.userRole = (localStorage.getItem('userRole') || 'HELPER').trim().toUpperCase();
    this.userName = localStorage.getItem('userName') || 'User';

    const roleName = this.isEmployer ? 'Employer' : 'Helper';
    this.toast.info(`Welcome back, ${this.userName}! Logged in as ${roleName}.`);

    if (this.isEmployer) {
      this.loadCachedEmployerStats();
    } else {
      this.loadCachedHelperStats();
    }

    this.fetchDashboardStatistics();
    this.fetchUnreadNotifications();
    this.initiatePolling();
  }

  ngOnDestroy(): void {
    if (this.notificationPollId) clearInterval(this.notificationPollId);
    if (this.statsPollId) clearInterval(this.statsPollId);
  }

  fetchDashboardStatistics(): void {
    if (this.isEmployer) {
      this.fetchEmployerStatistics();
    } else {
      this.fetchHelperStatistics();
    }
  }

  fetchEmployerStatistics(): void {
    forkJoin({
      tasks: this.taskService.getMyTasks().pipe(catchError(() => of([]))),
      requests: this.requestService.getIncomingRequests().pipe(catchError(() => of([])))
    }).subscribe({
      next: (response: any) => {
        const myTasks = Array.isArray(response.tasks) ? response.tasks : [];
        const incomingRequests = Array.isArray(response.requests) ? response.requests : [];

        this.activeTaskCount = myTasks.filter((t: any) => t?.status === 'open' || t?.status === 'in_progress').length;
        this.completedTaskCount = myTasks.filter((t: any) => t?.status === 'completed').length;
        this.pendingRequestCount = incomingRequests.filter((r: any) => r?.status === 'PENDING').length;

        const uniqueHelpers = new Set(incomingRequests.map((r: any) => r?.requester_name).filter(Boolean));
        this.totalHelperCount = uniqueHelpers.size;

        this.persistEmployerStats();
      }
    });
  }

  private loadCachedEmployerStats(): void {
    const raw = localStorage.getItem(this.employerStatsKey);
    if (!raw) return;

    try {
      const stats = JSON.parse(raw);
      this.activeTaskCount = Number(stats?.activeTasks) || 0;
      this.totalHelperCount = Number(stats?.totalHelpers) || 0;
      this.pendingRequestCount = Number(stats?.pendingRequests) || 0;
      this.completedTaskCount = Number(stats?.completedTasks) || 0;
    } catch {
      localStorage.removeItem(this.employerStatsKey);
    }
  }

  private persistEmployerStats(): void {
    localStorage.setItem(this.employerStatsKey, JSON.stringify({
      activeTasks: this.activeTaskCount,
      totalHelpers: this.totalHelperCount,
      pendingRequests: this.pendingRequestCount,
      completedTasks: this.completedTaskCount,
    }));
  }

  fetchHelperStatistics(): void {
    this.requestService.getMyRequests().pipe(catchError(() => of([]))).subscribe({
      next: (response: any) => {
        const requests = Array.isArray(response) ? response : [];

        this.appliedTaskCount = requests.length;
        this.acceptedApplicationCount = requests.filter((r: any) => r?.status === 'ACCEPTED').length;
        this.pendingApplicationCount = requests.filter((r: any) => r?.status === 'PENDING').length;
        this.completedJobCount = requests.filter((r: any) => r?.status === 'COMPLETED').length;

        this.persistHelperStats();
      }
    });
  }

  private loadCachedHelperStats(): void {
    const raw = localStorage.getItem(this.helperStatsKey);
    if (!raw) return;

    try {
      const stats = JSON.parse(raw);
      this.appliedTaskCount = Number(stats?.appliedTasks) || 0;
      this.acceptedApplicationCount = Number(stats?.acceptedApplications) || 0;
      this.pendingApplicationCount = Number(stats?.pendingApplications) || 0;
      this.completedJobCount = Number(stats?.completedJobs) || 0;
    } catch {
      localStorage.removeItem(this.helperStatsKey);
    }
  }

  private persistHelperStats(): void {
    localStorage.setItem(this.helperStatsKey, JSON.stringify({
      appliedTasks: this.appliedTaskCount,
      acceptedApplications: this.acceptedApplicationCount,
      pendingApplications: this.pendingApplicationCount,
      completedJobs: this.completedJobCount,
    }));
  }

  fetchUnreadNotifications(): void {
    this.notificationService.getNotifications().pipe(catchError(() => of([]))).subscribe({
      next: (response: any) => {
        const list = Array.isArray(response) ? response : [];
        this.unreadNotificationCount = list.filter((n: any) => !n?.is_read).length;

        if (!this.isInitialLoadDone) {
          list.forEach((n: any) => {
            if (n?.id) this.knownNotificationIds.add(n.id);
          });
          this.isInitialLoadDone = true;
          return;
        }

        list.forEach((n: any) => {
          if (n?.id) this.knownNotificationIds.add(n.id);
        });
      }
    });
  }

  private initiatePolling(): void {
    this.notificationPollId = setInterval(() => this.fetchUnreadNotifications(), 8000);
    this.statsPollId = setInterval(() => this.fetchDashboardStatistics(), 10000);
  }
}
