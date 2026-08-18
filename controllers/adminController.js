const bcrypt = require('bcryptjs');
const pool = require('../database');
const ProfileModel = require('../models/profileModel');
const ProjectModel = require('../models/projectModel');
const ExperienceModel = require('../models/experienceModel');
const ArticleModel = require('../models/articleModel');
const TestimonialModel = require('../models/testimonialModel');
const MessageModel = require('../models/messageModel');

class AdminController {
  // Middleware to protect routes
  static isAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) {
      return next();
    }
    res.redirect('/admin/login');
  }

  // Render login page
  static renderLogin(req, res) {
    if (req.session.isAdmin) {
      return res.redirect('/admin');
    }
    const error = req.session.loginError || null;
    req.session.loginError = null;
    res.render('login', { error, title: 'Admin Login' });
  }

  // Handle login request
  static async handleLogin(req, res) {
    const { username, password } = req.body;
    try {
      const [rows] = await pool.query('SELECT * FROM admin_config WHERE username = ?', [username]);
      const admin = rows[0];

      if (admin && await bcrypt.compare(password, admin.password_hash)) {
        req.session.isAdmin = true;
        req.session.username = username;
        return res.redirect('/admin');
      }

      req.session.loginError = 'Invalid username or password.';
      res.redirect('/admin/login');
    } catch (error) {
      console.error('Login error:', error);
      req.session.loginError = 'An error occurred. Please try again.';
      res.redirect('/admin/login');
    }
  }

  // Handle logout
  static handleLogout(req, res) {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/admin/login');
    });
  }

  // Render Admin Dashboard
  static async renderDashboard(req, res) {
    try {
      const profile = await ProfileModel.getProfile();
      const projects = await ProjectModel.getAll();
      const experiences = await ExperienceModel.getAll();
      const articles = await ArticleModel.getAll();
      const testimonials = await TestimonialModel.getAll();
      const messages = await MessageModel.getAll();
      const unreadCount = await MessageModel.getUnreadCount();

      const successMsg = req.session.adminSuccess || null;
      const errorMsg = req.session.adminError || null;
      req.session.adminSuccess = null;
      req.session.adminError = null;

      res.render('admin', {
        profile,
        projects,
        experiences,
        articles,
        testimonials,
        messages,
        unreadCount,
        successMessage: successMsg,
        errorMessage: errorMsg,
        title: 'Admin Dashboard'
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).send('Internal Server Error loading admin dashboard.');
    }
  }

  // Update Profile Info
  static async updateProfile(req, res) {
    try {
      await ProfileModel.updateProfile(req.body);
      req.session.adminSuccess = 'Profile details updated successfully!';
      res.redirect('/admin#profile');
    } catch (error) {
      console.error('Update profile error:', error);
      req.session.adminError = 'Failed to update profile details.';
      res.redirect('/admin#profile');
    }
  }

  // Project CRUD
  static async saveProject(req, res) {
    try {
      const { id, title, description, github_url, live_url, tech_stack, image_url, order_index } = req.body;
      const projectData = { title, description, github_url, live_url, tech_stack, image_url, order_index: parseInt(order_index || '0', 10) };

      if (id) {
        await ProjectModel.update(id, projectData);
        req.session.adminSuccess = 'Project updated successfully!';
      } else {
        await ProjectModel.create(projectData);
        req.session.adminSuccess = 'Project added successfully!';
      }
      res.redirect('/admin#projects');
    } catch (error) {
      console.error('Save project error:', error);
      req.session.adminError = 'Failed to save project.';
      res.redirect('/admin#projects');
    }
  }

  static async deleteProject(req, res) {
    try {
      const { id } = req.params;
      await ProjectModel.delete(id);
      req.session.adminSuccess = 'Project deleted successfully!';
      res.redirect('/admin#projects');
    } catch (error) {
      console.error('Delete project error:', error);
      req.session.adminError = 'Failed to delete project.';
      res.redirect('/admin#projects');
    }
  }

  // Experience CRUD
  static async saveExperience(req, res) {
    try {
      const { id, role, company, type, start_date, end_date, impact_bullets, order_index } = req.body;
      const expData = { role, company, type, start_date, end_date, impact_bullets, order_index: parseInt(order_index || '0', 10) };

      if (id) {
        await ExperienceModel.update(id, expData);
        req.session.adminSuccess = 'Experience item updated successfully!';
      } else {
        await ExperienceModel.create(expData);
        req.session.adminSuccess = 'Experience item added successfully!';
      }
      res.redirect('/admin#experience');
    } catch (error) {
      console.error('Save experience error:', error);
      req.session.adminError = 'Failed to save experience item.';
      res.redirect('/admin#experience');
    }
  }

  static async deleteExperience(req, res) {
    try {
      const { id } = req.params;
      await ExperienceModel.delete(id);
      req.session.adminSuccess = 'Experience item deleted successfully!';
      res.redirect('/admin#experience');
    } catch (error) {
      console.error('Delete experience error:', error);
      req.session.adminError = 'Failed to delete experience item.';
      res.redirect('/admin#experience');
    }
  }

  // Article CRUD
  static async saveArticle(req, res) {
    try {
      const { id, title, summary, content, slug, read_time, publish_date } = req.body;
      
      // Auto-generate slug if not provided
      let finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!finalSlug) {
        finalSlug = `post-${Date.now()}`;
      }

      const articleData = { title, summary, content, slug: finalSlug, read_time, publish_date };

      if (id) {
        await ArticleModel.update(id, articleData);
        req.session.adminSuccess = 'Article updated successfully!';
      } else {
        await ArticleModel.create(articleData);
        req.session.adminSuccess = 'Article published successfully!';
      }
      res.redirect('/admin#articles');
    } catch (error) {
      console.error('Save article error:', error);
      req.session.adminError = 'Failed to save article. (Slugs must be unique)';
      res.redirect('/admin#articles');
    }
  }

  static async deleteArticle(req, res) {
    try {
      const { id } = req.params;
      await ArticleModel.delete(id);
      req.session.adminSuccess = 'Article deleted successfully!';
      res.redirect('/admin#articles');
    } catch (error) {
      console.error('Delete article error:', error);
      req.session.adminError = 'Failed to delete article.';
      res.redirect('/admin#articles');
    }
  }

  // Testimonial CRUD
  static async saveTestimonial(req, res) {
    try {
      const { id, quote, author, title_or_role, company_or_class, avatar_url } = req.body;
      const testData = { quote, author, title_or_role, company_or_class, avatar_url };

      if (id) {
        await TestimonialModel.update(id, testData);
        req.session.adminSuccess = 'Testimonial updated successfully!';
      } else {
        await TestimonialModel.create(testData);
        req.session.adminSuccess = 'Testimonial added successfully!';
      }
      res.redirect('/admin#testimonials');
    } catch (error) {
      console.error('Save testimonial error:', error);
      req.session.adminError = 'Failed to save testimonial.';
      res.redirect('/admin#testimonials');
    }
  }

  static async deleteTestimonial(req, res) {
    try {
      const { id } = req.params;
      await TestimonialModel.delete(id);
      req.session.adminSuccess = 'Testimonial deleted successfully!';
      res.redirect('/admin#testimonials');
    } catch (error) {
      console.error('Delete testimonial error:', error);
      req.session.adminError = 'Failed to delete testimonial.';
      res.redirect('/admin#testimonials');
    }
  }

  // Message Inbox Handlers
  static async markMessageRead(req, res) {
    try {
      const { id } = req.params;
      await MessageModel.markAsRead(id);
      req.session.adminSuccess = 'Message marked as read.';
      res.redirect('/admin#inbox');
    } catch (error) {
      console.error('Read message error:', error);
      req.session.adminError = 'Failed to mark message as read.';
      res.redirect('/admin#inbox');
    }
  }

  static async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      await MessageModel.delete(id);
      req.session.adminSuccess = 'Message deleted successfully!';
      res.redirect('/admin#inbox');
    } catch (error) {
      console.error('Delete message error:', error);
      req.session.adminError = 'Failed to delete message.';
      res.redirect('/admin#inbox');
    }
  }

  // Change Admin Password
  static async changePassword(req, res) {
    try {
      const { old_password, new_password } = req.body;
      const username = req.session.username;

      const [rows] = await pool.query('SELECT * FROM admin_config WHERE username = ?', [username]);
      const admin = rows[0];

      if (admin && await bcrypt.compare(old_password, admin.password_hash)) {
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(new_password, salt);
        
        await pool.query('UPDATE admin_config SET password_hash = ? WHERE username = ?', [newHash, username]);
        req.session.adminSuccess = 'Password changed successfully!';
        return res.redirect('/admin#settings');
      }

      req.session.adminError = 'Incorrect current password.';
      res.redirect('/admin#settings');
    } catch (error) {
      console.error('Change password error:', error);
      req.session.adminError = 'Failed to change password.';
      res.redirect('/admin#settings');
    }
  }
}

module.exports = AdminController;
