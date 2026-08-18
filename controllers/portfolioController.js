const ProfileModel = require('../models/profileModel');
const ProjectModel = require('../models/projectModel');
const ExperienceModel = require('../models/experienceModel');
const ArticleModel = require('../models/articleModel');
const TestimonialModel = require('../models/testimonialModel');
const MessageModel = require('../models/messageModel');

class PortfolioController {
  static async renderIndex(req, res) {
    try {
      const profile = await ProfileModel.getProfile();
      const projects = await ProjectModel.getAll();
      const experiences = await ExperienceModel.getAll();
      const articles = await ArticleModel.getAll();
      const testimonials = await TestimonialModel.getAll();
      
      // Flash message check
      const successMsg = req.session.successMessage || null;
      req.session.successMessage = null; // Clear after reading

      res.render('index', {
        profile,
        projects,
        experiences,
        articles,
        testimonials,
        successMessage: successMsg,
        title: profile ? profile.name : 'Personal CV Portfolio'
      });
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  static async renderArticle(req, res) {
    try {
      const slug = req.params.slug;
      const article = await ArticleModel.getBySlug(slug);
      const profile = await ProfileModel.getProfile();
      
      if (!article) {
        return res.status(404).send('Article not found');
      }

      res.render('article', {
        article,
        profile,
        title: `${article.title} | The Teaching Lab`
      });
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  static async submitContact(req, res) {
    try {
      const { name, email, message } = req.body;
      
      if (!name || !email || !message) {
        req.session.errorMessage = 'All fields are required.';
        return res.redirect('/#contact');
      }

      await MessageModel.create({
        sender_name: name,
        sender_email: email,
        message_text: message
      });

      req.session.successMessage = 'Thank you! Your message has been sent successfully.';
      res.redirect('/#contact');
    } catch (error) {
      console.error('Error processing contact form submission:', error);
      res.status(500).send('Error saving message. Please try again.');
    }
  }
}

module.exports = PortfolioController;
