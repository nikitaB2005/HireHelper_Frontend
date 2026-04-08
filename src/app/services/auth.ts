import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}accounts/`;
  private http = inject(HttpClient);

  register(credentials: any) {
    return this.http.post(`${this.baseUrl}register/`, credentials);
  }

  login(credentials: any) {
    return this.http.post(`${this.baseUrl}login/`, credentials);
  }

  verifyOtp(data: any) {
    return this.http.post(`${this.baseUrl}verify-otp/`, data);
  }

  resendOtp(data: any) {
    return this.http.post(`${this.baseUrl}resend-otp/`, data);
  }

  forgotPassword(data: any) {
    return this.http.post(`${this.baseUrl}forgot-password/`, data);
  }

  resetPassword(data: any) {
    return this.http.post(`${this.baseUrl}reset-password/`, data);
  }

  getProfile() {
    return this.http.get(`${this.baseUrl}profile/`);
  }

  updateProfile(profileData: FormData) {
    return this.http.put(`${this.baseUrl}profile/`, profileData);
  }
}
