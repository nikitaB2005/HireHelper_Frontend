import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly baseUrl = `${environment.apiUrl}tasks/`;
  private http = inject(HttpClient);

  getFeed() {
    return this.http.get(`${this.baseUrl}feed/`);
  }

  createTask(taskData: any) {
    return this.http.post(`${this.baseUrl}create/`, taskData);
  }

  getMyTasks() {
    return this.http.get(`${this.baseUrl}mytasks/`);
  }

  updateTask(taskId: number, taskData: any) {
    return this.http.patch(`${this.baseUrl}update/${taskId}/`, taskData);
  }

  completeTask(taskId: number) {
    return this.http.post(`${this.baseUrl}complete/${taskId}/`, {});
  }

  deleteTask(taskId: number) {
    return this.http.delete(`${this.baseUrl}delete/${taskId}/`);
  }
}
