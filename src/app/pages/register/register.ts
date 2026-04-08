import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  registerData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  };

  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  handleRegistration() {
    // Password match validation
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.toast.error('Passwords do not match');
      return;
    }

    // Build payload for backend
    const payload = {
      username: this.registerData.email.split('@')[0],
      first_name: this.registerData.firstName,
      last_name: this.registerData.lastName || '',
      email: this.registerData.email,
      password: this.registerData.password,
      role: this.registerData.role,
      phone_number: '',
      city: ''
    };

    this.authService.register(payload).subscribe({
      next: (response: any) => {
        localStorage.setItem('pendingOtpEmail', this.registerData.email);

        if (response?.otp) {
          this.toast.warning(`Email delivery failed. Use this OTP from response: ${response.otp}`, 4500);
        } else {
          this.toast.success('Registration successful. Please verify the OTP sent to your email.');
        }

        this.router.navigate(['/otp']);
      },
      error: (error) => {
        if (error.status === 0) {
          this.toast.error('Unable to connect to the server. Please check your internet connection.');
        } else {
          const errorMessage = error?.error ? JSON.stringify(error.error) : 'Registration failed. Please try again.';
          this.toast.error(errorMessage);
        }
      }
    });
  }
}
