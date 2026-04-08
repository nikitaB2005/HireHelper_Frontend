import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestService } from '../../services/request';
import { ToastService } from '../../services/toast';
import { ProfileModalComponent } from '../../components/profile-modal/profile-modal.component';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileModalComponent],
  templateUrl: './requests.html',
  styleUrl: './requests.css',
})
export class Requests implements OnInit {
  requests: any[] = [];
  filteredRequests: any[] = [];

  isLoading = false;
  searchQuery = '';
  selectedStatus = '';
  sortBy = 'latest';
  
  activeReplyId: number | null = null;
  replyDrafts: Record<number, string> = {};
  isSavingReply = false;

  // Profile Modal State
  isProfileModalOpen = false;
  profileUserId: number | null = null;
  profileUserName = '';
  profileUserRating: number | string | null = null;

  constructor(private requestService: RequestService, private toast: ToastService) {}

  ngOnInit(): void {
    this.fetchIncomingRequests();
  }

  fetchIncomingRequests() {
    this.isLoading = true;
    this.requestService.getIncomingRequests().subscribe({
      next: (response: any) => {
        this.requests = Array.isArray(response) ? response : [];
        this.filterRequests();
        this.isLoading = false;
      },
      error: () => {
        this.requests = [];
        this.filteredRequests = [];
        this.isLoading = false;
        this.toast.error('Failed to load incoming requests.');
      }
    });
  }

  filterRequests() {
    let filtered = [...this.requests];

    if (this.selectedStatus) {
      filtered = filtered.filter((item) => item.status === this.selectedStatus);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        (item.task_title || '').toLowerCase().includes(query) ||
        (item.requester_name || '').toLowerCase().includes(query) ||
        (item.task_location || '').toLowerCase().includes(query) ||
        (item.message || '').toLowerCase().includes(query) ||
        (item.hirer_reply || '').toLowerCase().includes(query)
      );
    }

    this.filteredRequests = filtered;
    this.sortRequests();
  }

  sortRequests() {
    switch (this.sortBy) {
      case 'oldest':
        this.filteredRequests.sort(
          (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
        break;
      case 'task':
        this.filteredRequests.sort((a, b) =>
          (a.task_title || '').localeCompare(b.task_title || '')
        );
        break;
      default:
        this.filteredRequests.sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    }
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.sortBy = 'latest';
    this.filterRequests();
  }

  handleRequestAcceptance(request: any) {
    if (!request?.id) return;

    const previousStatus = request.status;
    request.status = 'ACCEPTED';
    this.filterRequests();

    this.requestService.acceptRequest(request.id).subscribe({
      next: () => {
        this.toast.success('Request accepted successfully.');
      },
      error: () => {
        request.status = previousStatus;
        this.filterRequests();
        this.toast.error('Failed to accept request.');
      }
    });
  }

  handleRequestRejection(request: any) {
    if (!request?.id) return;

    const previousStatus = request.status;
    request.status = 'REJECTED';
    this.filterRequests();

    this.requestService.rejectRequest(request.id).subscribe({
      next: () => {
        this.toast.info('Request rejected successfully.');
      },
      error: () => {
        request.status = previousStatus;
        this.filterRequests();
        this.toast.error('Failed to reject request.');
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      PENDING: 'Pending',
      ACCEPTED: 'Accepted',
      REJECTED: 'Rejected',
      COMPLETED: 'Completed',
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
      minute: '2-digit',
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

  initiateReply(request: any): void {
    if (!request?.id) return;
    this.activeReplyId = request.id;
    this.replyDrafts[request.id] = request.hirer_reply || '';
  }

  cancelReply(): void {
    this.activeReplyId = null;
    this.isSavingReply = false;
  }

  handleReplySubmission(request: any): void {
    if (!request?.id || this.isSavingReply) return;

    this.isSavingReply = true;
    const replyText = (this.replyDrafts[request.id] || '').trim();

    this.requestService.replyToRequest(request.id, replyText).subscribe({
      next: (response: any) => {
        request.hirer_reply = response?.request?.hirer_reply ?? replyText;
        this.cancelReply();
        this.toast.success('Reply sent successfully.');
      },
      error: (err) => {
        this.isSavingReply = false;
        this.toast.error(err?.error?.error || 'Failed to send reply.');
      }
    });
  }

  openProfileModal(userId: number, userName: string, rating: number | string | null = null) {
    if (!userId) return;
    this.profileUserId = userId;
    this.profileUserName = userName;
    this.profileUserRating = rating;
    this.isProfileModalOpen = true;
  }
}
