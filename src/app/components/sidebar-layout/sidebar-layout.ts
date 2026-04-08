import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';
import { NotificationService } from '../../services/notification';
import { ProfileModalComponent } from '../profile-modal/profile-modal.component';

@Component({
  selector: 'app-sidebar-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ProfileModalComponent],
  templateUrl: './sidebar-layout.html',
  styleUrl: './sidebar-layout.css'
})
export class SidebarLayoutComponent {
  unreadCount = 0;
  isSidebarOpen = true;
  showProfileModal = false;
  showImageModal = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadNotificationCount();
  }

  private loadNotificationCount(): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications: any) => {
        this.unreadCount = notifications?.length || 0;
      },
      error: () => {
        this.unreadCount = 0;
      }
    });
  }

  get userName(): string {
    return localStorage.getItem('userName') || 'User';
  }

  get userEmail(): string {
    return localStorage.getItem('userEmail') || '';
  }

  get userProfilePicture(): string {
    return localStorage.getItem('userProfilePicture') || '';
  }

  get userRating(): string {
    const rating = localStorage.getItem('userRating');
    return rating && rating !== '0.0' ? rating : '';
  }

  get role(): string {
    return (localStorage.getItem('userRole') || 'helper').trim().toUpperCase();
  }

  get isEmployer(): boolean {
    return this.role === 'HIRER';
  }

  get isHelper(): boolean {
    return this.role === 'HELPER';
  }

  get currentUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  }

  openReviewsModal(): void {
    this.showProfileModal = true;
  }

  closeReviewsModal(): void {
    this.showProfileModal = false;
  }

  openImageModal(): void {
    if (this.userProfilePicture) {
      this.showImageModal = true;
    }
  }

  closeImageModal(): void {
    this.showImageModal = false;
  }

  viewNotifications(): void {
    this.unreadCount = 0;
    this.router.navigate(['/notifications']);
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  private loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (profile: any) => {
        localStorage.setItem('userName', profile?.first_name || profile?.username || 'User');
        localStorage.setItem('userRole', profile?.role || 'helper');
        localStorage.setItem('userEmail', profile?.email || '');
        localStorage.setItem('userProfilePicture', profile?.profile_picture || '');
        localStorage.setItem('userRating', String(profile?.average_rating || '0.0'));
      },
      error: () => {
        // Keep showing stored values when profile request fails.
      }
    });
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
