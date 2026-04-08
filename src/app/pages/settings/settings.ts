import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings implements OnInit {
  profileData = {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'helper',
    phone_number: '',
    bio: '',
    city: '',
    address: '',
    profile_picture: '',
  };

  selectedImageFile: File | null = null;
  imagePreviewUrl = '';

  passwordForm = {
    password: '',
    confirmPassword: '',
  };
  isPasswordSectionVisible = false;

  isLoading = false;
  successMessage = '';
  passwordErrorMessage = '';
  generalErrorMessage = '';

  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Immediate local cache load
    this.profileData.first_name = localStorage.getItem('userName') || '';
    this.profileData.email = localStorage.getItem('userEmail') || '';
    this.profileData.role = localStorage.getItem('userRole') || 'helper';
    this.imagePreviewUrl = localStorage.getItem('userProfilePicture') || '';

    this.fetchUserProfile();
  }

  fetchUserProfile(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (response: any) => {
        this.profileData = { ...this.profileData, ...response };
        this.imagePreviewUrl = this.profileData.profile_picture || '';
        localStorage.setItem('userProfilePicture', this.profileData.profile_picture || '');
        this.isLoading = false;
      },
      error: () => {
        this.generalErrorMessage = 'Failed to load latest profile. Showing local data.';
        this.isLoading = false;
      }
    });
  }

  handleProfilePictureSelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedImageFile = file;
      this.imagePreviewUrl = URL.createObjectURL(file);
    }
  }

  handleProfileUpdate(): void {
    this.generalErrorMessage = '';
    this.passwordErrorMessage = '';

    if (this.isPasswordSectionVisible) {
      if (!this.passwordForm.password || !this.passwordForm.confirmPassword) {
        this.passwordErrorMessage = 'Both password fields are required.';
        return;
      }

      if (this.passwordForm.password !== this.passwordForm.confirmPassword) {
        this.passwordErrorMessage = 'Passwords do not match.';
        return;
      }
    }

    const payload = new FormData();
    payload.append('username', this.profileData.username || '');
    payload.append('first_name', this.profileData.first_name || '');
    payload.append('last_name', this.profileData.last_name || '');
    payload.append('role', this.profileData.role || 'helper');
    payload.append('phone_number', this.profileData.phone_number || '');
    payload.append('bio', this.profileData.bio || '');
    payload.append('city', this.profileData.city || '');
    payload.append('address', this.profileData.address || '');

    if (this.selectedImageFile) {
      payload.append('profile_picture', this.selectedImageFile);
    }

    if (this.isPasswordSectionVisible && this.passwordForm.password) {
      payload.append('password', this.passwordForm.password);
      payload.append('confirm_password', this.passwordForm.confirmPassword);
    }

    this.authService.updateProfile(payload).subscribe({
      next: (updated: any) => {
        localStorage.setItem('userName', updated?.first_name || updated?.username || 'User');
        localStorage.setItem('userRole', updated?.role || 'helper');
        localStorage.setItem('userEmail', updated?.email || '');
        localStorage.setItem('userProfilePicture', updated?.profile_picture || this.imagePreviewUrl || '');

        this.profileData = { ...this.profileData, ...updated };
        this.imagePreviewUrl = this.profileData.profile_picture || this.imagePreviewUrl;

        this.passwordForm.password = '';
        this.passwordForm.confirmPassword = '';
        this.isPasswordSectionVisible = false;
        this.selectedImageFile = null;

        this.successMessage = 'Profile updated successfully.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.generalErrorMessage = 
          error?.error?.phone_number?.[0] || 
          error?.error?.password?.[0] || 
          error?.error?.detail || 
          'Failed to update profile.';
      }
    });
  }

  handleLogout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getRoleLabel(): string {
    return this.profileData.role?.toLowerCase() === 'hirer' ? 'Hirer' : 'Helper';
  }
}
