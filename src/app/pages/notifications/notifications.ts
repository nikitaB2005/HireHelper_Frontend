import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];
  isLoading = true;

  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private toast = inject(ToastService);

  ngOnInit() {
    this.fetchNotifications();
  }

  fetchNotifications() {
    this.isLoading = true;
    this.notificationService.getNotifications().subscribe({
      next: (response: any) => {
        this.notifications = response || [];
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Failed to load notifications.');
        this.isLoading = false;
      }
    });
  }

  handleNotificationClick(notification: any) {
    const routeLink = notification.link;
    
    // Mark as read by deleting
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        if (routeLink) {
          this.router.navigate([routeLink]);
        }
      },
      error: () => {
         // Follow link even if delete fails
         if (routeLink) {
           this.router.navigate([routeLink]);
         }
      }
    });
  }
}
