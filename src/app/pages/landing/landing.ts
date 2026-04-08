import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class LandingComponent implements OnInit {
  activeRole: 'hirer' | 'helper' = 'hirer';
  
  aboutInfo = {
    vision: "To create a global network where every skill finds a home and every neighbor feels empowered to help.",
    mission: "To bridge the gap between skill and opportunity through a secure, transparent, and rewarding community platform.",
    values: ["Trust", "Local Growth", "Mutual Support", "Transparency"]
  };

  categories = [
    { name: 'Cleaning', icon: '✨', count: '124 active' },
    { name: 'Gardening', icon: '🌿', count: '89 active' },
    { name: 'Tech Help', icon: '💻', count: '56 active' },
    { name: 'Moving', icon: '📦', count: '42 active' },
    { name: 'Painting', icon: '🎨', count: '31 active' },
    { name: 'Pet Care', icon: '🐾', count: '78 active' }
  ];

  stats = [
    { label: 'Active Tasks', value: 1240, suffix: '+' },
    { label: 'Verified Helpers', value: 485, suffix: '' },
    { label: 'Neighborhoods', value: 15, suffix: '' },
    { label: 'Success Rate', value: 99, suffix: '%' }
  ];

  testimonials = [
    { name: 'Alex Rivera', role: 'Hirer', text: 'HireHelper changed how I manage my home projects. Found a gardener in 10 minutes!', size: 'large', avatar: '👨‍💼' },
    { name: 'Sarah Chen', role: 'Helper', text: 'Earning extra rewards while helping my neighbors is incredible.', size: 'small', avatar: '👩‍🎨' },
    { name: 'Jordan Hayes', role: 'Hirer', text: 'The protocol is secure and transparent. Highly recommend.', size: 'medium', avatar: '👨‍🔬' },
    { name: 'Priya Mani', role: 'Helper', text: 'Verified tasks only. No more guessing.', size: 'small', avatar: '👩‍💻' }
  ];

  faqItems = [
    { q: 'How does HireHelper work?', a: 'Users post tasks for the local community. Verified helpers apply, and once a match is made, the project begins. Success is verified by both parties.', open: false },
    { q: 'Is it free to join?', a: 'Yes, joining the HireHelper community is completely free. We only take a small fee when a task is successfully resolved.', open: false },
    { q: 'How are helpers verified?', a: 'Helpers are verified through community ratings, previous performance history, and a secure identity check.', open: false },
    { q: 'What kind of rewards can I earn?', a: 'Helpers earn local rewards and reputation points that unlock higher-tier tasks and exclusive community benefits.', open: false }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    if (localStorage.getItem('userToken')) {
      this.router.navigate(['/dashboard']);
    }
    this.initScrollReveal();
  }

  private initScrollReveal() {
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
          }
        });
      }, { threshold: 0.1 });

      setTimeout(() => {
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
      }, 500);
    }
  }

  toggleFaq(index: number) {
    this.faqItems[index].open = !this.faqItems[index].open;
  }

  setRole(role: 'hirer' | 'helper') {
    this.activeRole = role;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleCategoryClick(category: string) {
    this.router.navigate(['/feed'], { queryParams: { category: category.toLowerCase() } });
  }
}
