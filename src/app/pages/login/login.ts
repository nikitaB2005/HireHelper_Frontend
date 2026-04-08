import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginData = {
    email: '',
    password: ''
  };

  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  handleLogin() {
    // Basic email normalization
    this.loginData.email = this.loginData.email.trim().toLowerCase();

    this.authService.login(this.loginData).subscribe({
      next: (response: any) => {
        // Store session tokens
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refresh);

        // Store user profile details for quick UI access
        if (response.user) {
          localStorage.setItem('userRole', response.user.role);
          localStorage.setItem('userName', response.user.name);
          localStorage.setItem('userEmail', response.user.email);
          localStorage.setItem('userId', String(response.user.id));
          localStorage.setItem('userProfilePicture', response.user.profile_picture || '');
        }

        this.toast.success('Login successful');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        const message = error?.error?.error || 'Invalid Credentials';

        // Check if account needs verification
        if (message === 'Account not verified') {
          localStorage.setItem('pendingOtpEmail', this.loginData.email);
          localStorage.setItem('pendingOtpTriggerResend', 'true');
          this.toast.warning('Account not verified. A new OTP will be sent to your email.');
          this.router.navigate(['/otp']);
          return;
        }

        this.toast.error(message);
      }
    });
  }
}
