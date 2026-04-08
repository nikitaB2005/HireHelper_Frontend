import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  // Correct pluralized base URL matching backend/backend/urls.py
  private readonly baseUrl = `${environment.apiUrl}requests/`;
  private http = inject(HttpClient);

  sendRequest(taskId: number, message: string) {
    return this.http.post(`${this.baseUrl}`, { task_id: taskId, message });
  }

  getMyRequests() {
    // backend endpoint: api/requests/my/
    return this.http.get(`${this.baseUrl}my/`);
  }

  getIncomingRequests() {
    // backend endpoint: api/requests/received/
    return this.http.get(`${this.baseUrl}received/`);
  }

  acceptRequest(requestId: number) {
    // backend endpoint: api/requests/accept/<int:request_id>/
    return this.http.post(`${this.baseUrl}accept/${requestId}/`, {});
  }

  rejectRequest(requestId: number) {
    // backend endpoint: api/requests/reject/<int:request_id>/
    return this.http.post(`${this.baseUrl}reject/${requestId}/`, {});
  }

  replyToRequest(requestId: number, reply: string) {
    // backend endpoint: api/requests/reply/<int:request_id>/
    // backend expects payload with "hirer_reply" key
    return this.http.patch(`${this.baseUrl}reply/${requestId}/`, { hirer_reply: reply });
  }

  updateMyRequest(requestId: number, message: string) {
    // backend endpoint: api/requests/<int:request_id>/ (handles PATCH)
    return this.http.patch(`${this.baseUrl}${requestId}/`, { message });
  }

  deleteMyRequest(requestId: number) {
    // backend endpoint: api/requests/<int:request_id>/ (handles DELETE)
    return this.http.delete(`${this.baseUrl}${requestId}/`);
  }

  getRequestHistory(taskId: number) {
    return this.http.get(`${this.baseUrl}history/${taskId}/`);
  }
}
