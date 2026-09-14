// ANCHOR: Complete Backend Server for Bulukumba Tourism API
// All backend logic in one file - routes, controllers, middleware, and database operations
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import { randomUUID } from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import { pool, query } from './config.js';
import { env } from './environment.js';
import {
  getSessionCookieOptions,
  normalizeImageReference,
  normalizeMapEmbedUrl,
  normalizeOptionalHttpUrl,
} from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const router = express.Router();
const PORT = env.PORT;
const LEGACY_ADMIN_USERNAME = 'admin';
const LEGACY_ADMIN_PASSWORD = 'admin123';
const MIN_INITIAL_ADMIN_PASSWORD_LENGTH = 12;
const CATEGORY_ENTITY_TYPES = ['wisata', 'hotel', 'restoran'];
const CATEGORY_ENTITY_LABELS = {
  wisata: 'objek wisata',
  hotel: 'hotel',
  restoran: 'restoran',
};
const CATEGORY_DEFAULT_SEEDS = {
  wisata: [
    { name: 'Pantai', description: 'Destinasi wisata pantai dan pesisir.' },
    { name: 'Pulau', description: 'Destinasi pulau dan kawasan bahari.' },
    { name: 'Air Terjun', description: 'Destinasi air terjun dan aliran sungai alami.' },
    { name: 'Bukit & Panorama', description: 'Destinasi bukit, puncak, dan titik panorama.' },
    { name: 'Wisata Budaya & Sejarah', description: 'Destinasi budaya lokal, cagar sejarah, dan warisan tradisi.' },
    { name: 'Wisata Religi', description: 'Destinasi religi, ziarah, dan situs keagamaan.' },
    { name: 'Ekowisata & Alam', description: 'Destinasi konservasi, alam terbuka, dan ekowisata.' },
    { name: 'Wisata Keluarga & Rekreasi', description: 'Destinasi santai, rekreasi, dan kunjungan keluarga.' },
  ],
  hotel: [
    { name: 'Hotel', description: 'Akomodasi hotel umum.' },
    { name: 'Resort', description: 'Akomodasi resort untuk liburan.' },
    { name: 'Villa / Cottage', description: 'Akomodasi villa, cottage, atau sejenisnya.' },
    { name: 'Homestay / Penginapan', description: 'Homestay, guest house, dan penginapan sederhana.' },
  ],
  restoran: [
    { name: 'Seafood', description: 'Restoran dengan menu utama hasil laut.' },
    { name: 'Kuliner Khas Daerah', description: 'Restoran yang menonjolkan makanan khas lokal.' },
    { name: 'Rumah Makan Keluarga', description: 'Tempat makan untuk keluarga dan rombongan.' },
    { name: 'Kafe & Kopi', description: 'Kafe, kedai kopi, dan tempat nongkrong.' },
  ],
};

const sessionCookieOptions = getSessionCookieOptions(env);

app.disable('x-powered-by');
app.set('trust proxy', env.TRUST_PROXY);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === env.FRONTEND_URL) {
      return callback(null, true);
    }
    return callback(new Error('Origin tidak diizinkan'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Requested-With'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.IS_PRODUCTION ? 'combined' : 'dev'));
}

// Serve static files (uploaded images)
router.use('/uploads', express.static(env.UPLOAD_DIR, {
  dotfiles: 'deny',
  fallthrough: true,
  immutable: true,
  maxAge: '7d',
  setHeaders(response) {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Disposition', 'inline');
  },
}));

// Upload configuration
const uploadsDir = env.UPLOAD_DIR;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o750 });
}

function getLocalUploadPath(imageReference) {
  if (!imageReference || !imageReference.startsWith('/uploads/')) return null;
  const filename = imageReference.slice('/uploads/'.length);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}$/.test(filename)) return null;
  return path.join(uploadsDir, filename);
}

async function deleteLocalUpload(imageReference) {
  const localPath = getLocalUploadPath(imageReference);
  if (!localPath) return;

  try {
    const usageRows = await query(
      `SELECT
        (SELECT COUNT(*) FROM galeri WHERE gambar = ?) +
        (SELECT COUNT(*) FROM \`event\` WHERE gambar_event = ?) AS reference_count`,
      [imageReference, imageReference]
    );
    if (Number(usageRows[0]?.reference_count || 0) > 0) return;

    await fs.promises.unlink(localPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to delete upload ${path.basename(localPath)}:`, error.message);
    }
  }
}

async function deleteLocalUploads(imageReferences) {
  await Promise.all(imageReferences.map((imageReference) => deleteLocalUpload(imageReference)));
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
});

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Batas pengiriman ulasan tercapai. Coba lagi nanti.' },
});

function requireTrustedOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.get('origin');
  if (origin === env.FRONTEND_URL || (!env.IS_PRODUCTION && !origin)) {
    return next();
  }

  return res.status(403).json({ message: 'Origin tidak diizinkan' });
}

// Authentication middleware
function requireAuth(req, res, next) {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ===== REVIEW BUSINESS LOGIC =====

// Validate review input
function validateReviewInput(reviewData) {
  const errors = [];
  
  // Rating validation: 1.0 - 5.0 dengan increment 0.5
  if (!reviewData.rating || reviewData.rating < 1.0 || reviewData.rating > 5.0) {
    errors.push('Rating harus antara 1.0 - 5.0');
  }
  
  // Check if rating is in 0.5 increments
  if (reviewData.rating % 0.5 !== 0) {
    errors.push('Rating harus dalam kelipatan 0.5');
  }
  
  // Nama reviewer validation: wajib, maksimal 150 karakter
  if (!reviewData.nama_reviewer || reviewData.nama_reviewer.trim() === '') {
    errors.push('Nama reviewer wajib diisi');
  } else if (reviewData.nama_reviewer.length > 150) {
    errors.push('Nama reviewer maksimal 150 karakter');
  }
  
  // Email validation: opsional, jika diisi harus valid
  if (reviewData.email_reviewer && reviewData.email_reviewer.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reviewData.email_reviewer)) {
      errors.push('Format email tidak valid');
    }
  }
  
  // Komentar validation: maksimal 1000 karakter
  if (reviewData.komentar && reviewData.komentar.length > 1000) {
    errors.push('Komentar maksimal 1000 karakter');
  }
  
  // Entity validation: harus ada id_wisata, id_hotel, atau id_restoran
  if (!reviewData.id_wisata && !reviewData.id_hotel && !reviewData.id_restoran) {
    errors.push('ID wisata, hotel, atau restoran harus disediakan');
  }
  
  // Entity validation: hanya boleh ada satu
  const entityCount = [reviewData.id_wisata, reviewData.id_hotel, reviewData.id_restoran].filter(Boolean).length;
  if (entityCount > 1) {
    errors.push('Review hanya bisa untuk wisata, hotel, atau restoran, tidak ketiganya sekaligus');
  }
  
  return errors;
}

function countEntityReferences({ id_wisata, id_hotel, id_restoran }) {
  return [id_wisata, id_hotel, id_restoran].filter(
    (value) => value !== undefined && value !== null && value !== ''
  ).length;
}

function validateGalleryReferenceInput(galleryData) {
  const entityCount = countEntityReferences(galleryData);

  if (entityCount === 0) {
    return 'Exactly one of id_wisata, id_hotel, or id_restoran is required';
  }

  if (entityCount > 1) {
    return 'Gallery must reference exactly one of id_wisata, id_hotel, or id_restoran';
  }

  return null;
}

function normalizeCategoryEntityType(entityType) {
  if (typeof entityType !== 'string') {
    return null;
  }

  const normalizedType = entityType.trim().toLowerCase();
  return CATEGORY_ENTITY_TYPES.includes(normalizedType) ? normalizedType : null;
}

function getCategoryEntityLabel(entityType) {
  return CATEGORY_ENTITY_LABELS[entityType] || entityType;
}

async function databaseColumnExists(tableName, columnName) {
  const rows = await query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return Number(rows[0]?.count || 0) > 0;
}

async function databaseIndexExists(tableName, indexName) {
  const rows = await query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?`,
    [tableName, indexName]
  );

  return Number(rows[0]?.count || 0) > 0;
}

async function databaseConstraintExists(tableName, constraintName) {
  const rows = await query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND CONSTRAINT_NAME = ?`,
    [tableName, constraintName]
  );

  return Number(rows[0]?.count || 0) > 0;
}

async function databaseTriggerExists(triggerName) {
  const rows = await query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TRIGGERS
     WHERE TRIGGER_SCHEMA = DATABASE()
       AND TRIGGER_NAME = ?`,
    [triggerName]
  );

  return Number(rows[0]?.count || 0) > 0;
}

async function getCategoryUsageSummary(categoryId) {
  const [wisataUsage, hotelUsage, restoranUsage] = await Promise.all([
    query('SELECT COUNT(*) AS count FROM wisata WHERE id_kategori = ?', [categoryId]),
    query('SELECT COUNT(*) AS count FROM hotel WHERE id_kategori = ?', [categoryId]),
    query('SELECT COUNT(*) AS count FROM restoran WHERE id_kategori = ?', [categoryId]),
  ]);

  return {
    wisata: Number(wisataUsage[0]?.count || 0),
    hotel: Number(hotelUsage[0]?.count || 0),
    restoran: Number(restoranUsage[0]?.count || 0),
  };
}

async function findCategoryByNameAndType(name, entityType) {
  const rows = await query(
    `SELECT id_kategori, nama_kategori, entity_type, deskripsi
     FROM kategori
     WHERE nama_kategori = ? AND entity_type = ?
     ORDER BY id_kategori ASC
     LIMIT 1`,
    [name, entityType]
  );

  return rows[0] || null;
}

async function ensureTypedCategoryFromLegacyCategory(category, entityType) {
  const existingCategory = await findCategoryByNameAndType(category.nama_kategori, entityType);
  if (existingCategory) {
    return existingCategory.id_kategori;
  }

  const result = await query(
    `INSERT INTO kategori (nama_kategori, entity_type, deskripsi)
     VALUES (?, ?, ?)`,
    [category.nama_kategori, entityType, category.deskripsi || null]
  );

  return result.insertId;
}

async function validateCategoryForEntity(categoryId, entityType) {
  if (categoryId === undefined || categoryId === null || categoryId === '') {
    return { valid: false, message: `Kategori ${getCategoryEntityLabel(entityType)} wajib dipilih` };
  }

  const normalizedEntityType = normalizeCategoryEntityType(entityType);
  if (!normalizedEntityType) {
    return { valid: false, message: 'Tipe kategori tidak valid' };
  }

  const rows = await query(
    `SELECT id_kategori, nama_kategori, entity_type
     FROM kategori
     WHERE id_kategori = ?
     LIMIT 1`,
    [categoryId]
  );

  if (!rows.length) {
    return { valid: false, message: 'Kategori tidak ditemukan' };
  }

  if (rows[0].entity_type !== normalizedEntityType) {
    return {
      valid: false,
      message: `Kategori yang dipilih bukan kategori untuk ${getCategoryEntityLabel(normalizedEntityType)}`,
    };
  }

  return { valid: true, category: rows[0] };
}

// Determine review status based on rating and comment
function determineReviewStatus(rating, komentar) {
  // Kata kunci spam yang akan trigger manual review
  const spamKeywords = [
    'spam', 'scam', 'fake', 'terrible', 'awful', 'horrible',
    'worst', 'bad', 'sucks', 'garbage', 'waste'
  ];
  
  // Cek apakah komentar mengandung kata kunci spam
  const hasSpamKeywords = spamKeywords.some(keyword => 
    komentar && komentar.toLowerCase().includes(keyword)
  );
  
  // Auto-approval: rating 3-5 dan tidak ada kata spam
  if (rating >= 3.0 && !hasSpamKeywords) {
    return 'approved';
  }
  
  // Manual review: rating 1-2 atau ada kata spam
  return 'pending';
}

// Update wisata rating statistics
async function updateWisataRating(id_wisata) {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating
      FROM review 
      WHERE id_wisata = ? AND status = 'approved'
    `, [id_wisata]);
    
    const totalReviews = stats[0].total_reviews || 0;
    const averageRating = parseFloat(stats[0].average_rating || 0).toFixed(2);
    
    await query(`
      UPDATE wisata 
      SET average_rating = ?, total_reviews = ?
      WHERE id_wisata = ?
    `, [averageRating, totalReviews, id_wisata]);
    
    return { total_reviews: totalReviews, average_rating: averageRating };
  } catch (error) {
    console.error('Error updating wisata rating:', error);
    throw error;
  }
}

// Update hotel rating statistics
async function updateHotelRating(id_hotel) {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating
      FROM review 
      WHERE id_hotel = ? AND status = 'approved'
    `, [id_hotel]);
    
    const totalReviews = stats[0].total_reviews || 0;
    const averageRating = parseFloat(stats[0].average_rating || 0).toFixed(2);
    
    await query(`
      UPDATE hotel 
      SET average_rating = ?, total_reviews = ?
      WHERE id_hotel = ?
    `, [averageRating, totalReviews, id_hotel]);
    
    return { total_reviews: totalReviews, average_rating: averageRating };
  } catch (error) {
    console.error('Error updating hotel rating:', error);
    throw error;
  }
}

// Update restoran rating statistics
async function updateRestoranRating(id_restoran) {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating
      FROM review 
      WHERE id_restoran = ? AND status = 'approved'
    `, [id_restoran]);
    
    const totalReviews = stats[0].total_reviews || 0;
    const averageRating = parseFloat(stats[0].average_rating || 0).toFixed(2);
    
    await query(`
      UPDATE restoran 
      SET average_rating = ?, total_reviews = ?
      WHERE id_restoran = ?
    `, [averageRating, totalReviews, id_restoran]);
    
    return { total_reviews: totalReviews, average_rating: averageRating };
  } catch (error) {
    console.error('Error updating restoran rating:', error);
    throw error;
  }
}

// ===== CONTROLLERS =====

function getPagination(queryParams) {
  const requestedPage = Number.parseInt(String(queryParams.page || ''), 10);
  const requestedLimit = Number.parseInt(String(queryParams.limit || ''), 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 100)
    : 10;

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

// Review Controllers
async function createReview(req, res) {
  try {
    const { id_wisata, id_hotel, id_restoran, nama_reviewer, email_reviewer, rating, komentar } = req.body;
    
    // Validasi input
    const validationErrors = validateReviewInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validasi gagal', 
        errors: validationErrors 
      });
    }
    
    // Cek apakah wisata, hotel, atau restoran exists
    let entityType = '';
    let entityId = null;
    
    if (id_wisata) {
      const wisata = await query('SELECT id_wisata FROM wisata WHERE id_wisata = ?', [id_wisata]);
      if (!wisata || wisata.length === 0) {
        return res.status(404).json({ message: 'Wisata tidak ditemukan' });
      }
      entityType = 'wisata';
      entityId = id_wisata;
    } else if (id_hotel) {
      const hotel = await query('SELECT id_hotel FROM hotel WHERE id_hotel = ?', [id_hotel]);
      if (!hotel || hotel.length === 0) {
        return res.status(404).json({ message: 'Hotel tidak ditemukan' });
      }
      entityType = 'hotel';
      entityId = id_hotel;
    } else if (id_restoran) {
      const restoran = await query('SELECT id_restoran FROM restoran WHERE id_restoran = ?', [id_restoran]);
      if (!restoran || restoran.length === 0) {
        return res.status(404).json({ message: 'Restoran tidak ditemukan' });
      }
      entityType = 'restoran';
      entityId = id_restoran;
    } else {
      return res.status(400).json({ message: 'ID wisata, hotel, atau restoran harus disediakan' });
    }
    
    // Determine review status
    const status = determineReviewStatus(rating, komentar);
    
    // Save review ke database
    const result = await query(`
      INSERT INTO review (id_wisata, id_hotel, id_restoran, nama_reviewer, email_reviewer, rating, komentar, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id_wisata || null,
      id_hotel || null,
      id_restoran || null,
      nama_reviewer.trim(),
      email_reviewer ? email_reviewer.trim() : null,
      rating,
      komentar ? komentar.trim() : null,
      status
    ]);
    
    // Update rating jika review approved
    if (status === 'approved') {
      if (entityType === 'wisata') {
        await updateWisataRating(entityId);
      } else if (entityType === 'hotel') {
        await updateHotelRating(entityId);
      } else if (entityType === 'restoran') {
        await updateRestoranRating(entityId);
      }
    }
    
    res.status(201).json({
      message: status === 'approved' ? 'Review berhasil ditambahkan' : 'Review sedang dalam moderasi',
      data: {
        id_review: result.insertId,
        status: status
      }
    });
    
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}

async function getReviewsByWisata(req, res) {
  try {
    const { id_wisata } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    
    // Get reviews
    const reviews = await query(`
      SELECT id_review, nama_reviewer, rating, komentar, created_at
      FROM review 
      WHERE id_wisata = ? AND status = 'approved'
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, [id_wisata]);
    
    // Get total count
    const totalResult = await query(`
      SELECT COUNT(*) as total
      FROM review 
      WHERE id_wisata = ? AND status = 'approved'
    `, [id_wisata]);
    
    const total = totalResult[0].total;
    
    res.json({
      data: reviews,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}

async function getReviewsByHotel(req, res) {
  try {
    const { id_hotel } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    
    // Get reviews
    const reviews = await query(`
      SELECT id_review, nama_reviewer, rating, komentar, created_at
      FROM review 
      WHERE id_hotel = ? AND status = 'approved'
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, [id_hotel]);
    
    // Get total count
    const totalResult = await query(`
      SELECT COUNT(*) as total
      FROM review 
      WHERE id_hotel = ? AND status = 'approved'
    `, [id_hotel]);
    
    const total = totalResult[0].total;
    
    res.json({
      data: reviews,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error getting hotel reviews:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}

async function getReviewsByRestoran(req, res) {
  try {
    const { id_restoran } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    
    // Get reviews
    const reviews = await query(`
      SELECT id_review, nama_reviewer, rating, komentar, created_at
      FROM review 
      WHERE id_restoran = ? AND status = 'approved'
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, [id_restoran]);
    
    // Get total count
    const totalResult = await query(`
      SELECT COUNT(*) as total
      FROM review 
      WHERE id_restoran = ? AND status = 'approved'
    `, [id_restoran]);
    
    const total = totalResult[0].total;
    
    res.json({
      data: reviews,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error getting restoran reviews:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}

async function getAllReviews(req, res) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const status = req.query.status;
    const type = req.query.type;
    
    let whereClause = '1=1';
    let params = [];
    
    if (status) {
      whereClause += ' AND r.status = ?';
      params.push(status);
    }
    
    if (type) {
      if (type === 'wisata') {
        whereClause += ' AND r.id_wisata IS NOT NULL';
      } else if (type === 'hotel') {
        whereClause += ' AND r.id_hotel IS NOT NULL';
      } else if (type === 'restoran') {
        whereClause += ' AND r.id_restoran IS NOT NULL';
      }
    }
    
    // Get reviews with wisata, hotel, and restoran info
    const reviews = await query(`
      SELECT r.id_review, r.nama_reviewer, r.email_reviewer, r.rating, r.komentar, 
             r.status, r.created_at, 
             w.nama_wisata, h.nama_hotel, rs.nama_restoran,
             CASE 
               WHEN r.id_wisata IS NOT NULL THEN 'wisata'
               WHEN r.id_hotel IS NOT NULL THEN 'hotel'
               WHEN r.id_restoran IS NOT NULL THEN 'restoran'
             END as review_type
      FROM review r
      LEFT JOIN wisata w ON r.id_wisata = w.id_wisata
      LEFT JOIN hotel h ON r.id_hotel = h.id_hotel
      LEFT JOIN restoran rs ON r.id_restoran = rs.id_restoran
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);
    
    // Get total count
    const totalResult = await query(`
      SELECT COUNT(*) as total
      FROM review r
      WHERE ${whereClause}
    `, params);
    
    const total = totalResult[0].total;
    
    res.json({
      data: reviews,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error getting all reviews:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}

async function updateReviewStatus(req, res) {
  try {
    const { id_review } = req.params;
    const { status } = req.body;
    
    // Validasi status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }
    
    // Get review info
    const review = await query('SELECT id_wisata, id_hotel, id_restoran FROM review WHERE id_review = ?', [id_review]);
    if (!review || review.length === 0) {
      return res.status(404).json({ message: 'Review tidak ditemukan' });
    }
    
    // Update status
    await query('UPDATE review SET status = ? WHERE id_review = ?', [status, id_review]);
    
    // Update rating jika status berubah ke approved
    if (status === 'approved') {
      if (review[0].id_wisata) {
        await updateWisataRating(review[0].id_wisata);
      } else if (review[0].id_hotel) {
        await updateHotelRating(review[0].id_hotel);
      } else if (review[0].id_restoran) {
        await updateRestoranRating(review[0].id_restoran);
      }
    }
    
    res.json({
      message: `Review berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`
    });
    
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}

async function getPendingReviews(req, res) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    
    // Get pending reviews
    const reviews = await query(`
      SELECT r.id_review, r.nama_reviewer, r.email_reviewer, r.rating, r.komentar, 
             r.created_at, w.nama_wisata, h.nama_hotel, rs.nama_restoran,
             CASE 
               WHEN r.id_wisata IS NOT NULL THEN 'wisata'
               WHEN r.id_hotel IS NOT NULL THEN 'hotel'
               WHEN r.id_restoran IS NOT NULL THEN 'restoran'
             END as review_type
      FROM review r
      LEFT JOIN wisata w ON r.id_wisata = w.id_wisata
      LEFT JOIN hotel h ON r.id_hotel = h.id_hotel
      LEFT JOIN restoran rs ON r.id_restoran = rs.id_restoran
      WHERE r.status = 'pending'
      ORDER BY r.created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `);
    
    // Get total count
    const totalResult = await query(`
      SELECT COUNT(*) as total
      FROM review 
      WHERE status = 'pending'
    `);
    
    const total = totalResult[0].total;
    
    res.json({
      data: reviews,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error getting pending reviews:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
}

// Attraction Controllers
async function getAllAttractions(req, res) {
  try {
    const rows = await query(
      `SELECT
         w.id_wisata,
         w.id_kategori,
         k.nama_kategori,
         w.nama_wisata,
         w.deskripsi,
         w.harga_tiket,
         w.jam_operasional,
         w.fasilitas,
         w.peta_wisata,
         w.keterangan,
         w.average_rating,
         w.total_reviews,
         (SELECT gg.gambar FROM galeri gg WHERE gg.id_wisata = w.id_wisata ORDER BY gg.id_galeri ASC LIMIT 1) AS cover_image_url
       FROM wisata w
       LEFT JOIN kategori k ON k.id_kategori = w.id_kategori
       ORDER BY w.id_wisata DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllAttractions error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getAttractionById(req, res) {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT
         w.id_wisata,
         w.id_kategori,
         k.nama_kategori,
         w.nama_wisata,
         w.deskripsi,
         w.harga_tiket,
         w.jam_operasional,
         w.fasilitas,
         w.peta_wisata,
         w.keterangan,
         w.average_rating,
         w.total_reviews,
         (SELECT gg.gambar FROM galeri gg WHERE gg.id_wisata = w.id_wisata ORDER BY gg.id_galeri ASC LIMIT 1) AS cover_image_url
       FROM wisata w
       LEFT JOIN kategori k ON k.id_kategori = w.id_kategori
       WHERE w.id_wisata = ?
       LIMIT 1`,
      [id]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getAttractionById error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createAttraction(req, res) {
  try {
    const {
      category_id,
      name,
      description,
      ticket_price,
      operational_hours,
      facilities,
      gmaps_iframe_url,
      keterangan,
    } = req.body || {};

    if (!name) return res.status(400).json({ message: 'Name is required' });
    const categoryValidation = await validateCategoryForEntity(category_id, 'wisata');
    if (!categoryValidation.valid) {
      return res.status(400).json({ message: categoryValidation.message });
    }
    let mapEmbedUrl;
    try {
      mapEmbedUrl = normalizeMapEmbedUrl(gmaps_iframe_url);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    const result = await query(
      `INSERT INTO wisata
        (id_kategori, nama_wisata, deskripsi, harga_tiket, jam_operasional, fasilitas, peta_wisata, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id || null,
        name,
        description || null,
        ticket_price || null,
        operational_hours || null,
        facilities || null,
        mapEmbedUrl,
        keterangan || null,
      ]
    );

    const newId = result.insertId;
    res.status(201).json({ id_wisata: newId });
  } catch (err) {
    console.error('createAttraction error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateAttraction(req, res) {
  try {
    const { id } = req.params;
    const normalizedBody = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(req.body, 'gmaps_iframe_url')) {
      try {
        normalizedBody.gmaps_iframe_url = normalizeMapEmbedUrl(req.body.gmaps_iframe_url);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'cover_image_url')) {
      try {
        normalizedBody.cover_image_url = normalizeImageReference(req.body.cover_image_url);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }
    const map = {
      category_id: 'id_kategori',
      name: 'nama_wisata',
      description: 'deskripsi',
      ticket_price: 'harga_tiket',
      operational_hours: 'jam_operasional',
      facilities: 'fasilitas',
      gmaps_iframe_url: 'peta_wisata',
      keterangan: 'keterangan',
    };

    const updates = [];
    const params = [];
    for (const [apiField, column] of Object.entries(map)) {
      if (Object.prototype.hasOwnProperty.call(normalizedBody, apiField)) {
        updates.push(`${column} = ?`);
        params.push(normalizedBody[apiField]);
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'category_id')) {
      const categoryValidation = await validateCategoryForEntity(req.body.category_id, 'wisata');
      if (!categoryValidation.valid) {
        return res.status(400).json({ message: categoryValidation.message });
      }
    }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE wisata SET ${updates.join(', ')} WHERE id_wisata = ?`, params);
    }

    if (Object.prototype.hasOwnProperty.call(normalizedBody, 'cover_image_url')) {
      const cover = normalizedBody.cover_image_url;
      if (cover) {
        const existing = await query(
          `SELECT id_galeri, gambar FROM galeri WHERE id_wisata = ? ORDER BY id_galeri ASC LIMIT 1`,
          [id]
        );
        if (existing && existing.length > 0) {
          await query(`UPDATE galeri SET gambar = ?, keterangan = ?, nama = ? WHERE id_galeri = ?`, [
            cover,
            'Cover',
            'Cover',
            existing[0].id_galeri,
          ]);
          if (existing[0].gambar !== cover) {
            await deleteLocalUpload(existing[0].gambar);
          }
        } else {
          await query(`INSERT INTO galeri (id_wisata, gambar, keterangan, nama) VALUES (?, ?, ?, ?)`, [
            id,
            cover,
            'Cover',
            'Cover',
          ]);
        }
      }
    }

    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('updateAttraction error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteAttraction(req, res) {
  try {
    const { id } = req.params;
    const galleries = await query('SELECT gambar FROM galeri WHERE id_wisata = ?', [id]);
    await query('DELETE FROM wisata WHERE id_wisata = ?', [id]);
    await deleteLocalUploads(galleries.map((gallery) => gallery.gambar));
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteAttraction error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Event Controllers
async function getAllEvents(req, res) {
  try {
    const rows = await query(
      `SELECT 
         id_event,
         nama_event,
         deskripsi_event,
         tempat,
         tanggal_mulai,
         gambar_event
       FROM \`event\`
       ORDER BY tanggal_mulai DESC, id_event DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllEvents error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getEventById(req, res) {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT 
         id_event,
         nama_event,
         deskripsi_event,
         tempat,
         tanggal_mulai,
         tanggal_selesai,
         gambar_event
       FROM \`event\`
       WHERE id_event = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getEventById error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createEvent(req, res) {
  try {
    const { name, description, event_date, end_date, location, image_url } = req.body || {};
    if (!name) return res.status(400).json({ message: 'Name is required' });
    let imageReference;
    try {
      imageReference = normalizeImageReference(image_url);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    const result = await query(
      `INSERT INTO \`event\` (nama_event, deskripsi_event, tempat, tanggal_mulai, tanggal_selesai, gambar_event)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || null, location || null, event_date || null, end_date || null, imageReference]
    );
    res.status(201).json({ id_event: result.insertId });
  } catch (err) {
    console.error('createEvent error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const existingRows = await query('SELECT gambar_event FROM `event` WHERE id_event = ?', [id]);
    if (!existingRows.length) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const normalizedBody = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(req.body, 'image_url')) {
      try {
        normalizedBody.image_url = normalizeImageReference(req.body.image_url);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }
    const map = {
      name: 'nama_event',
      description: 'deskripsi_event',
      location: 'tempat',
      event_date: 'tanggal_mulai',
      end_date: 'tanggal_selesai',
      image_url: 'gambar_event',
    };
    const updates = [];
    const params = [];
    for (const [apiField, column] of Object.entries(map)) {
      if (Object.prototype.hasOwnProperty.call(normalizedBody, apiField)) {
        updates.push(`${column} = ?`);
        params.push(normalizedBody[apiField]);
      }
    }
    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });
    params.push(id);
    await query(`UPDATE \`event\` SET ${updates.join(', ')} WHERE id_event = ?`, params);
    if (
      Object.prototype.hasOwnProperty.call(normalizedBody, 'image_url')
      && existingRows[0].gambar_event !== normalizedBody.image_url
    ) {
      await deleteLocalUpload(existingRows[0].gambar_event);
    }
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('updateEvent error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const rows = await query('SELECT gambar_event FROM `event` WHERE id_event = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Event not found' });
    }
    await query('DELETE FROM `event` WHERE id_event = ?', [id]);
    await deleteLocalUpload(rows[0].gambar_event);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteEvent error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Hotel Controllers
async function getAllHotels(req, res) {
  try {
    const rows = await query(
      `SELECT
         h.id_hotel,
         h.id_kategori,
         k.nama_kategori,
         h.nama_hotel,
         h.deskripsi,
         h.harga_kamar,
         h.alamat_hotel,
         h.nomor_telepon,
         h.website,
         h.fasilitas,
         h.peta_hotel,
         h.keterangan,
         h.average_rating,
         h.total_reviews,
         (SELECT gg.gambar FROM galeri gg WHERE gg.id_hotel = h.id_hotel ORDER BY gg.id_galeri ASC LIMIT 1) AS cover_image_url
       FROM hotel h
       LEFT JOIN kategori k ON k.id_kategori = h.id_kategori
       ORDER BY h.id_hotel DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllHotels error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getHotelById(req, res) {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT
         h.id_hotel,
         h.id_kategori,
         k.nama_kategori,
         h.nama_hotel,
         h.deskripsi,
         h.harga_kamar,
         h.alamat_hotel,
         h.nomor_telepon,
         h.website,
         h.fasilitas,
         h.peta_hotel,
         h.keterangan,
         h.average_rating,
         h.total_reviews,
         (SELECT gg.gambar FROM galeri gg WHERE gg.id_hotel = h.id_hotel ORDER BY gg.id_galeri ASC LIMIT 1) AS cover_image_url
       FROM hotel h
       LEFT JOIN kategori k ON k.id_kategori = h.id_kategori
       WHERE h.id_hotel = ?
       LIMIT 1`,
      [id]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getHotelById error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createHotel(req, res) {
  try {
    const {
      category_id,
      name,
      description,
      room_price,
      address,
      phone,
      website,
      facilities,
      gmaps_iframe_url,
      keterangan,
    } = req.body || {};

    if (!name) return res.status(400).json({ message: 'Name is required' });
    const categoryValidation = await validateCategoryForEntity(category_id, 'hotel');
    if (!categoryValidation.valid) {
      return res.status(400).json({ message: categoryValidation.message });
    }
    let mapEmbedUrl;
    let websiteUrl;
    try {
      mapEmbedUrl = normalizeMapEmbedUrl(gmaps_iframe_url);
      websiteUrl = normalizeOptionalHttpUrl(website, 'Website hotel');
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    const result = await query(
      `INSERT INTO hotel
        (id_kategori, nama_hotel, deskripsi, harga_kamar, alamat_hotel, nomor_telepon, website, fasilitas, peta_hotel, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id || null,
        name,
        description || null,
        room_price || null,
        address || null,
        phone || null,
        websiteUrl,
        facilities || null,
        mapEmbedUrl,
        keterangan || null,
      ]
    );

    const newId = result.insertId;
    res.status(201).json({ id_hotel: newId });
  } catch (err) {
    console.error('createHotel error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateHotel(req, res) {
  try {
    const { id } = req.params;
    const normalizedBody = { ...req.body };
    try {
      if (Object.prototype.hasOwnProperty.call(req.body, 'gmaps_iframe_url')) {
        normalizedBody.gmaps_iframe_url = normalizeMapEmbedUrl(req.body.gmaps_iframe_url);
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'website')) {
        normalizedBody.website = normalizeOptionalHttpUrl(req.body.website, 'Website hotel');
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'cover_image_url')) {
        normalizedBody.cover_image_url = normalizeImageReference(req.body.cover_image_url);
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    const map = {
      category_id: 'id_kategori',
      name: 'nama_hotel',
      description: 'deskripsi',
      room_price: 'harga_kamar',
      address: 'alamat_hotel',
      phone: 'nomor_telepon',
      website: 'website',
      facilities: 'fasilitas',
      gmaps_iframe_url: 'peta_hotel',
      keterangan: 'keterangan',
    };

    const updates = [];
    const params = [];
    for (const [apiField, column] of Object.entries(map)) {
      if (Object.prototype.hasOwnProperty.call(normalizedBody, apiField)) {
        updates.push(`${column} = ?`);
        params.push(normalizedBody[apiField]);
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'category_id')) {
      const categoryValidation = await validateCategoryForEntity(req.body.category_id, 'hotel');
      if (!categoryValidation.valid) {
        return res.status(400).json({ message: categoryValidation.message });
      }
    }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE hotel SET ${updates.join(', ')} WHERE id_hotel = ?`, params);
    }

    if (Object.prototype.hasOwnProperty.call(normalizedBody, 'cover_image_url')) {
      const cover = normalizedBody.cover_image_url;
      if (cover) {
        const existing = await query(
          `SELECT id_galeri, gambar FROM galeri WHERE id_hotel = ? ORDER BY id_galeri ASC LIMIT 1`,
          [id]
        );
        if (existing && existing.length > 0) {
          await query(`UPDATE galeri SET gambar = ?, keterangan = ?, nama = ? WHERE id_galeri = ?`, [
            cover,
            'Cover',
            'Cover',
            existing[0].id_galeri,
          ]);
          if (existing[0].gambar !== cover) {
            await deleteLocalUpload(existing[0].gambar);
          }
        } else {
          await query(`INSERT INTO galeri (id_hotel, gambar, keterangan, nama) VALUES (?, ?, ?, ?)`, [
            id,
            cover,
            'Cover',
            'Cover',
          ]);
        }
      }
    }

    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('updateHotel error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteHotel(req, res) {
  try {
    const { id } = req.params;
    const galleries = await query('SELECT gambar FROM galeri WHERE id_hotel = ?', [id]);
    await query('DELETE FROM hotel WHERE id_hotel = ?', [id]);
    await deleteLocalUploads(galleries.map((gallery) => gallery.gambar));
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteHotel error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Restoran Controllers
async function getAllRestorans(req, res) {
  try {
    const rows = await query(
      `SELECT
         r.id_restoran,
         r.id_kategori,
         k.nama_kategori,
         r.nama_restoran,
         r.deskripsi,
         r.harga_rata_rata,
         r.jam_operasional,
         r.alamat_restoran,
         r.nomor_telepon,
         r.website,
         r.menu_unggulan,
         r.peta_restoran,
         r.keterangan,
         r.average_rating,
         r.total_reviews,
         (SELECT gg.gambar FROM galeri gg WHERE gg.id_restoran = r.id_restoran ORDER BY gg.id_galeri ASC LIMIT 1) AS cover_image_url
       FROM restoran r
       LEFT JOIN kategori k ON k.id_kategori = r.id_kategori
       ORDER BY r.id_restoran DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllRestorans error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getRestoranById(req, res) {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT
         r.id_restoran,
         r.id_kategori,
         k.nama_kategori,
         r.nama_restoran,
         r.deskripsi,
         r.harga_rata_rata,
         r.jam_operasional,
         r.alamat_restoran,
         r.nomor_telepon,
         r.website,
         r.menu_unggulan,
         r.peta_restoran,
         r.keterangan,
         r.average_rating,
         r.total_reviews,
         (SELECT gg.gambar FROM galeri gg WHERE gg.id_restoran = r.id_restoran ORDER BY gg.id_galeri ASC LIMIT 1) AS cover_image_url
       FROM restoran r
       LEFT JOIN kategori k ON k.id_kategori = r.id_kategori
       WHERE r.id_restoran = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Restoran not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('getRestoranById error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createRestoran(req, res) {
  try {
    const {
      category_id,
      name,
      description,
      average_price,
      operational_hours,
      address,
      phone,
      website,
      featured_menu,
      gmaps_iframe_url,
      keterangan,
    } = req.body || {};

    if (!name) return res.status(400).json({ message: 'Name is required' });
    const categoryValidation = await validateCategoryForEntity(category_id, 'restoran');
    if (!categoryValidation.valid) {
      return res.status(400).json({ message: categoryValidation.message });
    }
    let mapEmbedUrl;
    let websiteUrl;
    try {
      mapEmbedUrl = normalizeMapEmbedUrl(gmaps_iframe_url);
      websiteUrl = normalizeOptionalHttpUrl(website, 'Website restoran');
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    const result = await query(
      `INSERT INTO restoran
        (id_kategori, nama_restoran, deskripsi, harga_rata_rata, jam_operasional, alamat_restoran, nomor_telepon, website, menu_unggulan, peta_restoran, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id || null,
        name,
        description || null,
        average_price || null,
        operational_hours || null,
        address || null,
        phone || null,
        websiteUrl,
        featured_menu || null,
        mapEmbedUrl,
        keterangan || null,
      ]
    );

    const newId = result.insertId;
    res.status(201).json({ id_restoran: newId });
  } catch (err) {
    console.error('createRestoran error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateRestoran(req, res) {
  try {
    const { id } = req.params;
    const {
      category_id,
      name,
      description,
      average_price,
      operational_hours,
      address,
      phone,
      website,
      featured_menu,
      gmaps_iframe_url,
      keterangan,
    } = req.body || {};

    if (!name) return res.status(400).json({ message: 'Name is required' });

    // Check if restoran exists
    const existingRows = await query('SELECT id_restoran FROM restoran WHERE id_restoran = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Restoran not found' });
    }

    // Update restoran
    const updateFields = [];
    const updateValues = [];

    if (category_id !== undefined) {
      const categoryValidation = await validateCategoryForEntity(category_id, 'restoran');
      if (!categoryValidation.valid) {
        return res.status(400).json({ message: categoryValidation.message });
      }
      updateFields.push('id_kategori = ?');
      updateValues.push(category_id || null);
    }
    if (name !== undefined) {
      updateFields.push('nama_restoran = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('deskripsi = ?');
      updateValues.push(description || null);
    }
    if (average_price !== undefined) {
      updateFields.push('harga_rata_rata = ?');
      updateValues.push(average_price || null);
    }
    if (operational_hours !== undefined) {
      updateFields.push('jam_operasional = ?');
      updateValues.push(operational_hours || null);
    }
    if (address !== undefined) {
      updateFields.push('alamat_restoran = ?');
      updateValues.push(address || null);
    }
    if (phone !== undefined) {
      updateFields.push('nomor_telepon = ?');
      updateValues.push(phone || null);
    }
    if (website !== undefined) {
      let websiteUrl;
      try {
        websiteUrl = normalizeOptionalHttpUrl(website, 'Website restoran');
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
      updateFields.push('website = ?');
      updateValues.push(websiteUrl);
    }
    if (featured_menu !== undefined) {
      updateFields.push('menu_unggulan = ?');
      updateValues.push(featured_menu || null);
    }
    if (gmaps_iframe_url !== undefined) {
      let mapEmbedUrl;
      try {
        mapEmbedUrl = normalizeMapEmbedUrl(gmaps_iframe_url);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
      updateFields.push('peta_restoran = ?');
      updateValues.push(mapEmbedUrl);
    }
    if (keterangan !== undefined) {
      updateFields.push('keterangan = ?');
      updateValues.push(keterangan || null);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await query(
        `UPDATE restoran SET ${updateFields.join(', ')} WHERE id_restoran = ?`,
        updateValues
      );
    }

    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('updateRestoran error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteRestoran(req, res) {
  try {
    const { id } = req.params;
    const galleries = await query('SELECT gambar FROM galeri WHERE id_restoran = ?', [id]);
    await query('DELETE FROM restoran WHERE id_restoran = ?', [id]);
    await deleteLocalUploads(galleries.map((gallery) => gallery.gambar));
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteRestoran error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Gallery Controllers
async function getAllGalleries(req, res) {
  try {
    const rows = await query(
      `SELECT 
         g.id_galeri,
         g.id_wisata,
         g.id_hotel,
         g.id_restoran,
         g.gambar,
         g.keterangan,
         g.nama,
         w.nama_wisata,
         h.nama_hotel,
         r.nama_restoran
       FROM galeri g
       LEFT JOIN wisata w ON g.id_wisata = w.id_wisata
       LEFT JOIN hotel h ON g.id_hotel = h.id_hotel
       LEFT JOIN restoran r ON g.id_restoran = r.id_restoran
       ORDER BY g.id_galeri DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllGalleries error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getGalleryById(req, res) {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT 
         g.id_galeri,
         g.id_wisata,
         g.id_hotel,
         g.id_restoran,
         g.gambar,
         g.keterangan,
         g.nama
       FROM galeri g
       WHERE g.id_galeri = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Gallery not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('getGalleryById error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createGallery(req, res) {
  try {
    const { id_wisata, id_hotel, id_restoran, gambar, keterangan, nama } = req.body || {};
    const galleryReferenceError = validateGalleryReferenceInput({ id_wisata, id_hotel, id_restoran });
    if (galleryReferenceError) return res.status(400).json({ message: galleryReferenceError });
    let imageReference;
    try {
      imageReference = normalizeImageReference(gambar);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    if (!imageReference) return res.status(400).json({ message: 'gambar is required' });
    const result = await query(
      `INSERT INTO galeri (id_wisata, id_hotel, id_restoran, gambar, keterangan, nama) VALUES (?, ?, ?, ?, ?, ?)`,
      [id_wisata || null, id_hotel || null, id_restoran || null, imageReference, keterangan || null, nama || null]
    );
    res.status(201).json({ id_galeri: result.insertId });
  } catch (err) {
    console.error('createGallery error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateGallery(req, res) {
  try {
    const { id } = req.params;
    const { id_wisata, id_hotel, id_restoran, gambar, keterangan, nama } = req.body;

    const existingGalleryRows = await query(
      'SELECT id_wisata, id_hotel, id_restoran, gambar FROM galeri WHERE id_galeri = ?',
      [id]
    );
    if (!existingGalleryRows.length) {
      return res.status(404).json({ message: 'Gallery not found' });
    }
    const existingGallery = existingGalleryRows[0];
    let imageReference = gambar;
    if (gambar !== undefined) {
      try {
        imageReference = normalizeImageReference(gambar);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
      if (!imageReference) {
        return res.status(400).json({ message: 'gambar is required' });
      }
    }
    
    // If updating image, get the old image path to delete it later
    let oldImagePath = null;
    if (gambar !== undefined) {
      oldImagePath = existingGallery.gambar;
    }

    const nextGalleryReferences = {
      id_wisata: id_wisata !== undefined ? id_wisata : existingGallery.id_wisata,
      id_hotel: id_hotel !== undefined ? id_hotel : existingGallery.id_hotel,
      id_restoran: id_restoran !== undefined ? id_restoran : existingGallery.id_restoran,
    };
    const galleryReferenceError = validateGalleryReferenceInput(nextGalleryReferences);
    if (galleryReferenceError) {
      return res.status(400).json({ message: galleryReferenceError });
    }
    
    const updates = [];
    const params = [];
    
    if (id_wisata !== undefined) {
      updates.push('id_wisata = ?');
      params.push(id_wisata);
    }
    if (id_hotel !== undefined) {
      updates.push('id_hotel = ?');
      params.push(id_hotel);
    }
    if (id_restoran !== undefined) {
      updates.push('id_restoran = ?');
      params.push(id_restoran);
    }
    if (gambar !== undefined) {
      updates.push('gambar = ?');
      params.push(imageReference);
    }
    if (keterangan !== undefined) {
      updates.push('keterangan = ?');
      params.push(keterangan);
    }
    if (nama !== undefined) {
      updates.push('nama = ?');
      params.push(nama);
    }
    
    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });
    params.push(id);
    await query(`UPDATE galeri SET ${updates.join(', ')} WHERE id_galeri = ?`, params);
    
    // Delete old image file if it was updated and it's a local file
    if (oldImagePath && gambar !== undefined && oldImagePath !== imageReference) {
      await deleteLocalUpload(oldImagePath);
    }
    
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error('updateGallery error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteGallery(req, res) {
  try {
    const { id } = req.params;
    
    // First, get the gallery data to know which file to delete
    const galleryData = await query('SELECT gambar FROM galeri WHERE id_galeri = ?', [id]);
    
    if (galleryData.length === 0) {
      return res.status(404).json({ message: 'Gallery not found' });
    }
    
    const imagePath = galleryData[0].gambar;
    
    // Delete from database first
    await query('DELETE FROM galeri WHERE id_galeri = ?', [id]);
    
    // If the image path is a local file (starts with /uploads/), delete the physical file
    await deleteLocalUpload(imagePath);
    
    res.json({ message: 'Gallery and associated file deleted successfully' });
  } catch (err) {
    console.error('deleteGallery error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Category Controllers
async function getAllCategories(req, res) {
  try {
    const requestedEntityType = req.query?.entity_type;
    const entityType = requestedEntityType ? normalizeCategoryEntityType(requestedEntityType) : null;
    if (requestedEntityType && !entityType) {
      return res.status(400).json({ message: 'Tipe kategori tidak valid' });
    }

    const whereClause = entityType ? 'WHERE entity_type = ?' : '';
    const rows = await query(
      `SELECT
         id_kategori,
         nama_kategori,
         entity_type,
         deskripsi
       FROM kategori
       ${whereClause}
       ORDER BY FIELD(entity_type, 'wisata', 'hotel', 'restoran'), nama_kategori ASC`,
      entityType ? [entityType] : []
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllCategories error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getCategoryById(req, res) {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT
         id_kategori,
         nama_kategori,
         entity_type,
         deskripsi
       FROM kategori
       WHERE id_kategori = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('getCategoryById error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function createCategory(req, res) {
  try {
    const { name, description, entity_type } = req.body;
    const normalizedEntityType = normalizeCategoryEntityType(entity_type);
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedName) {
      return res.status(400).json({ message: 'Nama kategori wajib diisi' });
    }

    if (!normalizedEntityType) {
      return res.status(400).json({ message: 'Tipe kategori wajib dipilih' });
    }

    const result = await query(
      `INSERT INTO kategori (nama_kategori, entity_type, deskripsi)
       VALUES (?, ?, ?)`,
      [normalizedName, normalizedEntityType, description || null]
    );
    
    res.status(201).json({
      id_kategori: result.insertId,
      nama_kategori: normalizedName,
      entity_type: normalizedEntityType,
      deskripsi: description,
      message: 'Kategori berhasil ditambahkan'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Nama kategori sudah digunakan untuk tipe kategori ini'
      });
    }
    console.error('createCategory error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, description, entity_type } = req.body;
    const normalizedEntityType = normalizeCategoryEntityType(entity_type);
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedName) {
      return res.status(400).json({ message: 'Nama kategori wajib diisi' });
    }

    if (!normalizedEntityType) {
      return res.status(400).json({ message: 'Tipe kategori wajib dipilih' });
    }

    const result = await query(
      `UPDATE kategori 
       SET nama_kategori = ?, entity_type = ?, deskripsi = ?
       WHERE id_kategori = ?`,
      [normalizedName, normalizedEntityType, description || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
    
    res.json({
      id_kategori: id,
      nama_kategori: normalizedName,
      entity_type: normalizedEntityType,
      deskripsi: description,
      message: 'Kategori berhasil diperbarui'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Nama kategori sudah digunakan untuk tipe kategori ini'
      });
    }
    console.error('updateCategory error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const usage = await getCategoryUsageSummary(id);
    const usedBy = Object.entries(usage)
      .filter(([, count]) => count > 0)
      .map(([entityType]) => getCategoryEntityLabel(entityType));

    if (usedBy.length > 0) {
      return res.status(400).json({
        message: `Kategori tidak dapat dihapus karena masih digunakan oleh: ${usedBy.join(', ')}`
      });
    }
    
    const result = await query(
      `DELETE FROM kategori WHERE id_kategori = ?`,
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }
    
    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (err) {
    console.error('deleteCategory error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin Controllers
async function login(req, res) {
  try {
    const { password } = req.body || {};
    const username = String((req.body && (req.body.username || req.body.email)) || '').trim();

    if (!username || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    if (username.length > 100 || password.length > 256) {
      return res.status(400).json({ message: 'Format kredensial tidak valid' });
    }

    const admins = await query(
      'SELECT id_admin AS id, username, password FROM admin WHERE username = ? LIMIT 1',
      [username]
    );
    if (!admins || admins.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const admin = admins[0];
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      env.JWT_SECRET,
      { expiresIn: `${env.SESSION_TTL_HOURS}h` }
    );
    res.setHeader('Cache-Control', 'no-store');
    res.cookie(env.SESSION_COOKIE_NAME, token, sessionCookieOptions);
    return res.json({
      user: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

function getAdminSession(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
    },
  });
}

function logout(_req, res) {
  const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions;
  res.clearCookie(env.SESSION_COOKIE_NAME, clearOptions);
  return res.status(204).end();
}

// Upload Controller
async function handleImageUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Gambar wajib diunggah' });
    }

    const detectedType = await fileTypeFromBuffer(req.file.buffer);
    const allowedTypes = new Map([
      ['image/jpeg', 'jpg'],
      ['image/png', 'png'],
      ['image/webp', 'webp'],
      ['image/gif', 'gif'],
    ]);
    const extension = detectedType && allowedTypes.get(detectedType.mime);

    if (!extension) {
      return res.status(400).json({
        message: 'Tipe file tidak valid. Gunakan JPEG, PNG, WEBP, atau GIF.',
      });
    }

    const filename = `${randomUUID()}.${extension}`;
    const destination = path.join(uploadsDir, filename);
    await fs.promises.writeFile(destination, req.file.buffer, {
      flag: 'wx',
      mode: 0o640,
    });
    const fileUrl = `/uploads/${filename}`;
    
    res.json({ 
      message: 'Gambar berhasil diunggah',
      url: fileUrl,
      filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Gagal menyimpan gambar' });
  }
}

// ===== ROUTES =====

function liveHealth(_req, res) {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}

router.get('/health/live', liveHealth);

router.get('/health/ready', async (_req, res) => {
  try {
    await query('SELECT 1 AS ready');
    return res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Readiness check failed:', error.message);
    return res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/health', liveHealth);
router.use(apiLimiter);

// Public API routes
router.get('/attractions', getAllAttractions);
router.get('/attractions/:id', getAttractionById);

router.get('/hotels', getAllHotels);
router.get('/hotels/:id', getHotelById);

router.get('/restorans', getAllRestorans);
router.get('/restorans/:id', getRestoranById);

router.get('/events', getAllEvents);
router.get('/events/:id', getEventById);

router.get('/gallery', getAllGalleries);
router.get('/gallery/:id', getGalleryById);

router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategoryById);

// Review routes (public)
router.post('/reviews', reviewLimiter, createReview);
router.get('/reviews/wisata/:id_wisata', getReviewsByWisata);
router.get('/reviews/hotel/:id_hotel', getReviewsByHotel);
router.get('/reviews/restoran/:id_restoran', getReviewsByRestoran);

// Admin login (public)
router.post('/admin/login', loginLimiter, requireTrustedOrigin, login);
router.post('/admin/logout', requireTrustedOrigin, logout);

// Protected admin routes - create a separate router for admin
const adminRouter = express.Router();
adminRouter.use(requireAuth);
adminRouter.use(requireTrustedOrigin);
adminRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
adminRouter.get('/session', getAdminSession);

// Admin attractions
adminRouter.get('/attractions', getAllAttractions);
adminRouter.get('/attractions/:id', getAttractionById);
adminRouter.post('/attractions', createAttraction);
adminRouter.put('/attractions/:id', updateAttraction);
adminRouter.delete('/attractions/:id', deleteAttraction);

// Admin hotels
adminRouter.get('/hotels', getAllHotels);
adminRouter.get('/hotels/:id', getHotelById);
adminRouter.post('/hotels', createHotel);
adminRouter.put('/hotels/:id', updateHotel);
adminRouter.delete('/hotels/:id', deleteHotel);

// Admin restorans
adminRouter.get('/restorans', getAllRestorans);
adminRouter.get('/restorans/:id', getRestoranById);
adminRouter.post('/restorans', createRestoran);
adminRouter.put('/restorans/:id', updateRestoran);
adminRouter.delete('/restorans/:id', deleteRestoran);

// Admin events
adminRouter.get('/events', getAllEvents);
adminRouter.get('/events/:id', getEventById);
adminRouter.post('/events', createEvent);
adminRouter.put('/events/:id', updateEvent);
adminRouter.delete('/events/:id', deleteEvent);

// Admin categories
adminRouter.get('/categories', getAllCategories);
adminRouter.get('/categories/:id', getCategoryById);
adminRouter.post('/categories', createCategory);
adminRouter.put('/categories/:id', updateCategory);
adminRouter.delete('/categories/:id', deleteCategory);

// Admin galleries
adminRouter.get('/galleries', getAllGalleries);
adminRouter.get('/galleries/:id', getGalleryById);
adminRouter.post('/galleries', createGallery);
adminRouter.put('/galleries/:id', updateGallery);
adminRouter.delete('/galleries/:id', deleteGallery);

// Admin reviews
adminRouter.get('/reviews', getAllReviews);
adminRouter.get('/reviews/pending', getPendingReviews);
adminRouter.put('/reviews/:id_review/status', updateReviewStatus);

// Admin upload
adminRouter.post('/upload-image', upload.single('image'), handleImageUpload);

// Mount admin router
router.use('/admin', adminRouter);

// ===== ERROR HANDLING =====

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

function handleApiError(err, req, res, _next) {
  const expectedClientError =
    err.type === 'entity.parse.failed'
    || err.type === 'entity.too.large'
    || err.code === 'LIMIT_FILE_SIZE'
    || err.message === 'Origin tidak diizinkan';
  if (!expectedClientError) {
    console.error('Error:', err);
  }
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format'
    });
  }
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request body terlalu besar. Maksimal 1MB.',
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB'
    });
  }
  
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err.message === 'Origin tidak diizinkan') {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: env.IS_PRODUCTION ? 'Internal server error' : (err.message || 'Internal server error')
  });
}

// The public deployment exposes a single, explicit API prefix.
app.use('/api', router);
app.use(handleApiError);

// ===== DATABASE INITIALIZATION =====

// Database connection test
async function ensureDatabaseConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ Database connection established');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize database tables if they don't exist
async function initializeDatabase() {
  try {
    // Create admin table
    await query(`
      CREATE TABLE IF NOT EXISTS admin (
        id_admin INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create kategori table
    await query(`
      CREATE TABLE IF NOT EXISTS kategori (
        id_kategori INT AUTO_INCREMENT PRIMARY KEY,
        nama_kategori VARCHAR(150) NOT NULL,
        entity_type ENUM('wisata', 'hotel', 'restoran') NOT NULL,
        deskripsi TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_kategori_entity_name (entity_type, nama_kategori)
      )
    `);

    // Create wisata table
    await query(`
      CREATE TABLE IF NOT EXISTS wisata (
        id_wisata INT AUTO_INCREMENT PRIMARY KEY,
        id_kategori INT NOT NULL,
        nama_wisata VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        harga_tiket VARCHAR(100),
        jam_operasional VARCHAR(100),
        fasilitas TEXT,
        peta_wisata TEXT,
        keterangan TEXT,
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        total_reviews INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_wisata_id_kategori (id_kategori),
        CONSTRAINT fk_wisata_kategori FOREIGN KEY (id_kategori)
          REFERENCES kategori(id_kategori) ON UPDATE CASCADE ON DELETE RESTRICT
      )
    `);

    // Create hotel table
    await query(`
      CREATE TABLE IF NOT EXISTS hotel (
        id_hotel INT AUTO_INCREMENT PRIMARY KEY,
        id_kategori INT NOT NULL,
        nama_hotel VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        harga_kamar VARCHAR(100),
        alamat_hotel TEXT,
        nomor_telepon VARCHAR(50),
        website VARCHAR(255),
        fasilitas TEXT,
        peta_hotel TEXT,
        keterangan TEXT,
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        total_reviews INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_hotel_id_kategori (id_kategori),
        CONSTRAINT fk_hotel_kategori FOREIGN KEY (id_kategori)
          REFERENCES kategori(id_kategori) ON UPDATE CASCADE ON DELETE RESTRICT
      )
    `);

    // Create restoran table
    await query(`
      CREATE TABLE IF NOT EXISTS restoran (
        id_restoran INT AUTO_INCREMENT PRIMARY KEY,
        id_kategori INT NOT NULL,
        nama_restoran VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        harga_rata_rata VARCHAR(100),
        jam_operasional VARCHAR(100),
        alamat_restoran TEXT,
        nomor_telepon VARCHAR(50),
        website VARCHAR(255),
        menu_unggulan TEXT,
        peta_restoran TEXT,
        keterangan TEXT,
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        total_reviews INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_restoran_id_kategori (id_kategori),
        CONSTRAINT fk_restoran_kategori FOREIGN KEY (id_kategori)
          REFERENCES kategori(id_kategori) ON UPDATE CASCADE ON DELETE RESTRICT
      )
    `);

    // Create event table
    await query(`
      CREATE TABLE IF NOT EXISTS \`event\` (
        id_event INT AUTO_INCREMENT PRIMARY KEY,
        nama_event VARCHAR(255) NOT NULL,
        deskripsi_event TEXT,
        tempat VARCHAR(255),
        tanggal_mulai DATE,
        tanggal_selesai DATE,
        gambar_event VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create galeri table
    await query(`
      CREATE TABLE IF NOT EXISTS galeri (
        id_galeri INT AUTO_INCREMENT PRIMARY KEY,
        id_wisata INT NULL,
        id_hotel INT NULL,
        id_restoran INT NULL,
        gambar VARCHAR(500) NOT NULL,
        keterangan TEXT,
        nama VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_galeri_id_wisata (id_wisata),
        KEY idx_galeri_id_hotel (id_hotel),
        KEY idx_galeri_id_restoran (id_restoran),
        CONSTRAINT fk_galeri_wisata FOREIGN KEY (id_wisata)
          REFERENCES wisata(id_wisata) ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_galeri_hotel FOREIGN KEY (id_hotel)
          REFERENCES hotel(id_hotel) ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_galeri_restoran FOREIGN KEY (id_restoran)
          REFERENCES restoran(id_restoran) ON UPDATE CASCADE ON DELETE CASCADE
      )
    `);



    // Create review table
    await query(`
      CREATE TABLE IF NOT EXISTS review (
        id_review INT AUTO_INCREMENT PRIMARY KEY,
        id_wisata INT NULL,
        id_hotel INT NULL,
        id_restoran INT NULL,
        nama_reviewer VARCHAR(150) NOT NULL,
        email_reviewer VARCHAR(255),
        rating DECIMAL(2,1) NOT NULL,
        komentar TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_review_id_wisata (id_wisata),
        KEY idx_review_id_hotel (id_hotel),
        KEY idx_review_id_restoran (id_restoran),
        KEY idx_review_status (status),
        KEY idx_review_created_at (created_at),
        CONSTRAINT fk_review_wisata FOREIGN KEY (id_wisata)
            REFERENCES wisata(id_wisata)
            ON UPDATE CASCADE
            ON DELETE CASCADE,
        CONSTRAINT fk_review_hotel FOREIGN KEY (id_hotel)
            REFERENCES hotel(id_hotel)
            ON UPDATE CASCADE
            ON DELETE CASCADE,
        CONSTRAINT fk_review_restoran FOREIGN KEY (id_restoran)
            REFERENCES restoran(id_restoran)
            ON UPDATE CASCADE
            ON DELETE CASCADE,
        CONSTRAINT chk_review_rating CHECK (
          rating BETWEEN 1.0 AND 5.0 AND MOD(rating * 10, 5) = 0
        )
      )
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

async function migrateCategoriesToTypedModel() {
  try {
    if (!(await databaseColumnExists('kategori', 'entity_type'))) {
      await query(`
        ALTER TABLE kategori
        ADD COLUMN entity_type ENUM('wisata', 'hotel', 'restoran') NULL
        AFTER nama_kategori
      `);
    }

    if (await databaseColumnExists('kategori', 'gambar')) {
      await query('ALTER TABLE kategori DROP COLUMN gambar');
    }

    if (await databaseIndexExists('kategori', 'uq_kategori_nama')) {
      await query('ALTER TABLE kategori DROP INDEX uq_kategori_nama');
    }

    const categoryRows = await query(
      `SELECT id_kategori, nama_kategori, deskripsi, entity_type
       FROM kategori
       ORDER BY id_kategori ASC`
    );
    const categoriesById = new Map(categoryRows.map((row) => [row.id_kategori, row]));
    const entityTables = [
      { entityType: 'wisata', tableName: 'wisata' },
      { entityType: 'hotel', tableName: 'hotel' },
      { entityType: 'restoran', tableName: 'restoran' },
    ];

    for (const { entityType, tableName } of entityTables) {
      const references = await query(
        `SELECT DISTINCT id_kategori
         FROM ${tableName}
         WHERE id_kategori IS NOT NULL`
      );

      for (const reference of references) {
        const category = categoriesById.get(reference.id_kategori);
        if (!category) {
          continue;
        }

        if (category.entity_type === entityType) {
          continue;
        }

        const typedCategoryId = await ensureTypedCategoryFromLegacyCategory(category, entityType);
        await query(
          `UPDATE ${tableName}
           SET id_kategori = ?
           WHERE id_kategori = ?`,
          [typedCategoryId, reference.id_kategori]
        );

        if (!categoriesById.has(typedCategoryId)) {
          categoriesById.set(typedCategoryId, {
            ...category,
            id_kategori: typedCategoryId,
            entity_type: entityType,
          });
        }
      }
    }

    const refreshedCategories = await query(
      `SELECT id_kategori, nama_kategori, deskripsi, entity_type
       FROM kategori
       ORDER BY id_kategori ASC`
    );

    for (const category of refreshedCategories) {
      if (normalizeCategoryEntityType(category.entity_type)) {
        continue;
      }

      const wisataCategory = await findCategoryByNameAndType(category.nama_kategori, 'wisata');
      if (wisataCategory && wisataCategory.id_kategori !== category.id_kategori) {
        await query('DELETE FROM kategori WHERE id_kategori = ?', [category.id_kategori]);
        continue;
      }

      await query(
        'UPDATE kategori SET entity_type = ? WHERE id_kategori = ?',
        ['wisata', category.id_kategori]
      );
    }

    await query(`
      ALTER TABLE kategori
      MODIFY COLUMN entity_type ENUM('wisata', 'hotel', 'restoran') NOT NULL
    `);

    if (!(await databaseIndexExists('kategori', 'uq_kategori_entity_name'))) {
      await query(`
        ALTER TABLE kategori
        ADD CONSTRAINT uq_kategori_entity_name UNIQUE (entity_type, nama_kategori)
      `);
    }

    console.log('✅ Category model migrated');
  } catch (error) {
    console.error('❌ Category migration failed:', error.message);
    throw error;
  }
}

async function seedDefaultCategories() {
  try {
    for (const [entityType, categories] of Object.entries(CATEGORY_DEFAULT_SEEDS)) {
      for (const category of categories) {
        await query(
          `INSERT IGNORE INTO kategori (nama_kategori, entity_type, deskripsi)
           VALUES (?, ?, ?)`,
          [category.name, entityType, category.description]
        );
      }
    }

    console.log('✅ Default categories ensured');
  } catch (error) {
    console.error('❌ Default category seeding failed:', error.message);
    throw error;
  }
}

async function migrateLegacyMapEmbedValues() {
  const mapColumns = [
    { table: 'wisata', idColumn: 'id_wisata', mapColumn: 'peta_wisata' },
    { table: 'hotel', idColumn: 'id_hotel', mapColumn: 'peta_hotel' },
    { table: 'restoran', idColumn: 'id_restoran', mapColumn: 'peta_restoran' },
  ];

  for (const { table, idColumn, mapColumn } of mapColumns) {
    const rows = await query(
      `SELECT ${idColumn} AS id, ${mapColumn} AS map_value
       FROM ${table}
       WHERE ${mapColumn} IS NOT NULL AND TRIM(${mapColumn}) <> ''`
    );

    for (const row of rows) {
      let normalizedValue = null;
      try {
        normalizedValue = normalizeMapEmbedUrl(row.map_value);
      } catch {
        console.warn(`⚠️  Removed unsafe map value from ${table} id ${row.id}`);
      }

      if (normalizedValue !== row.map_value) {
        await query(
          `UPDATE ${table} SET ${mapColumn} = ? WHERE ${idColumn} = ?`,
          [normalizedValue, row.id]
        );
      }
    }
  }

  console.log('✅ Legacy map values normalized');
}

async function migrateLegacyExternalUrls() {
  const websiteColumns = [
    { table: 'hotel', idColumn: 'id_hotel', column: 'website', label: 'Website hotel' },
    { table: 'restoran', idColumn: 'id_restoran', column: 'website', label: 'Website restoran' },
  ];

  for (const item of websiteColumns) {
    const rows = await query(
      `SELECT ${item.idColumn} AS id, ${item.column} AS value
       FROM ${item.table}
       WHERE ${item.column} IS NOT NULL AND TRIM(${item.column}) <> ''`
    );
    for (const row of rows) {
      let normalizedValue = null;
      try {
        normalizedValue = normalizeOptionalHttpUrl(row.value, item.label);
      } catch {
        console.warn(`⚠️  Removed unsafe website from ${item.table} id ${row.id}`);
      }
      if (normalizedValue !== row.value) {
        await query(
          `UPDATE ${item.table} SET ${item.column} = ? WHERE ${item.idColumn} = ?`,
          [normalizedValue, row.id]
        );
      }
    }
  }

  const galleryRows = await query(
    `SELECT id_galeri AS id, gambar AS value
     FROM galeri
     WHERE gambar IS NOT NULL AND TRIM(gambar) <> ''`
  );
  for (const row of galleryRows) {
    let normalizedValue;
    try {
      normalizedValue = normalizeImageReference(row.value);
    } catch {
      throw new Error(`Galeri id ${row.id} memiliki referensi gambar yang tidak aman`);
    }
    if (normalizedValue !== row.value) {
      await query('UPDATE galeri SET gambar = ? WHERE id_galeri = ?', [normalizedValue, row.id]);
    }
  }

  const eventRows = await query(
    `SELECT id_event AS id, gambar_event AS value
     FROM \`event\`
     WHERE gambar_event IS NOT NULL AND TRIM(gambar_event) <> ''`
  );
  for (const row of eventRows) {
    let normalizedValue = null;
    try {
      normalizedValue = normalizeImageReference(row.value);
    } catch {
      console.warn(`⚠️  Removed unsafe event image from event id ${row.id}`);
    }
    if (normalizedValue !== row.value) {
      await query(
        'UPDATE `event` SET gambar_event = ? WHERE id_event = ?',
        [normalizedValue, row.id]
      );
    }
  }

  console.log('✅ Legacy website and image URLs normalized');
}

async function alignExistingSchema() {
  await query('ALTER TABLE admin MODIFY COLUMN username VARCHAR(100) NOT NULL');
  await query('ALTER TABLE kategori MODIFY COLUMN nama_kategori VARCHAR(150) NOT NULL');
  await query('ALTER TABLE wisata MODIFY COLUMN harga_tiket VARCHAR(100) NULL');
  await query('ALTER TABLE hotel MODIFY COLUMN harga_kamar VARCHAR(100) NULL');
  await query('ALTER TABLE wisata MODIFY COLUMN nama_wisata VARCHAR(255) NOT NULL');
  await query('ALTER TABLE hotel MODIFY COLUMN nama_hotel VARCHAR(255) NOT NULL');
  await query('ALTER TABLE restoran MODIFY COLUMN nama_restoran VARCHAR(255) NOT NULL');
  await query('ALTER TABLE hotel MODIFY COLUMN nomor_telepon VARCHAR(50) NULL');
  await query('ALTER TABLE restoran MODIFY COLUMN nomor_telepon VARCHAR(50) NULL');
  console.log('✅ Existing schema aligned');
}

async function alignIdentifierLengths() {
  await query('ALTER TABLE admin MODIFY COLUMN username VARCHAR(100) NOT NULL');
  await query('ALTER TABLE kategori MODIFY COLUMN nama_kategori VARCHAR(150) NOT NULL');
  console.log('✅ Admin and category lengths aligned');
}

async function ensureEntityIntegrityConstraints() {
  const [invalidGalleries] = await query(
    `SELECT COUNT(*) AS count
     FROM galeri
     WHERE (id_wisata IS NOT NULL) + (id_hotel IS NOT NULL) + (id_restoran IS NOT NULL) <> 1`
  );
  const [invalidReviews] = await query(
    `SELECT COUNT(*) AS count
     FROM review
     WHERE (id_wisata IS NOT NULL) + (id_hotel IS NOT NULL) + (id_restoran IS NOT NULL) <> 1`
  );
  const [invalidRatings] = await query(
    `SELECT COUNT(*) AS count
     FROM review
     WHERE rating < 1.0 OR rating > 5.0 OR MOD(rating * 10, 5) <> 0`
  );

  if (Number(invalidGalleries?.count || 0) > 0) {
    throw new Error('Data galeri lama melanggar aturan satu entitas. Perbaiki data sebelum migrasi.');
  }
  if (Number(invalidReviews?.count || 0) > 0) {
    throw new Error('Data review lama melanggar aturan satu entitas. Perbaiki data sebelum migrasi.');
  }
  if (Number(invalidRatings?.count || 0) > 0) {
    throw new Error('Data rating lama berada di luar rentang atau kelipatan yang diizinkan.');
  }

  if (await databaseConstraintExists('galeri', 'chk_galeri_single_entity')) {
    await query('ALTER TABLE galeri DROP CHECK chk_galeri_single_entity');
  }

  if (await databaseConstraintExists('review', 'chk_review_single_entity')) {
    await query('ALTER TABLE review DROP CHECK chk_review_single_entity');
  }

  if (!(await databaseConstraintExists('review', 'chk_review_rating'))) {
    await query(`
      ALTER TABLE review
      ADD CONSTRAINT chk_review_rating CHECK (
        rating BETWEEN 1.0 AND 5.0 AND MOD(rating * 10, 5) = 0
      )
    `);
  }

  const entityTriggers = [
    { name: 'trg_galeri_single_entity_insert', table: 'galeri', event: 'INSERT' },
    { name: 'trg_galeri_single_entity_update', table: 'galeri', event: 'UPDATE' },
    { name: 'trg_review_single_entity_insert', table: 'review', event: 'INSERT' },
    { name: 'trg_review_single_entity_update', table: 'review', event: 'UPDATE' },
  ];

  for (const trigger of entityTriggers) {
    if (await databaseTriggerExists(trigger.name)) continue;
    await pool.query(`
      CREATE TRIGGER ${trigger.name}
      BEFORE ${trigger.event} ON ${trigger.table}
      FOR EACH ROW
      BEGIN
        IF ((NEW.id_wisata IS NOT NULL) + (NEW.id_hotel IS NOT NULL) + (NEW.id_restoran IS NOT NULL)) <> 1 THEN
          SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Exactly one entity reference is required';
        END IF;
      END
    `);
  }

  console.log('✅ Entity integrity triggers and rating constraint ensured');
}

async function runMigrations() {
  await initializeDatabase();
  const appliedRows = await query('SELECT version FROM schema_migrations');
  const appliedVersions = new Set(appliedRows.map((row) => row.version));
  const migrations = [
    {
      version: '20260728_01_typed_categories',
      name: 'Migrate categories to typed model',
      up: migrateCategoriesToTypedModel,
    },
    {
      version: '20260728_02_align_schema',
      name: 'Align existing table definitions',
      up: alignExistingSchema,
    },
    {
      version: '20260728_03_safe_map_urls',
      name: 'Normalize legacy map embed values',
      up: migrateLegacyMapEmbedValues,
    },
    {
      version: '20260728_04_entity_constraints',
      name: 'Add gallery and review integrity constraints',
      up: ensureEntityIntegrityConstraints,
    },
    {
      version: '20260728_05_safe_external_urls',
      name: 'Normalize legacy website and image URLs',
      up: migrateLegacyExternalUrls,
    },
    {
      version: '20260728_06_identifier_lengths',
      name: 'Align admin and category identifier lengths',
      up: alignIdentifierLengths,
    },
  ];

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) continue;
    await migration.up();
    await query(
      'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
      [migration.version, migration.name]
    );
    console.log(`✅ Applied migration ${migration.version}`);
  }

  await seedDefaultCategories();
}

function validateInitialAdminBootstrapConfig(username, password) {
  const normalizedUsername = (username || '').trim();

  if (!normalizedUsername) {
    return 'INITIAL_ADMIN_USERNAME is required when admin bootstrap is enabled';
  }

  if (!password) {
    return 'INITIAL_ADMIN_PASSWORD is required when admin bootstrap is enabled';
  }

  if (password === LEGACY_ADMIN_PASSWORD) {
    return 'INITIAL_ADMIN_PASSWORD must not reuse the legacy default password';
  }

  if (password.length < MIN_INITIAL_ADMIN_PASSWORD_LENGTH) {
    return `INITIAL_ADMIN_PASSWORD must be at least ${MIN_INITIAL_ADMIN_PASSWORD_LENGTH} characters long`;
  }

  return null;
}

async function migrateLegacyDefaultAdmin(admins, initialUsername, initialPassword) {
  if (admins.length !== 1) {
    return false;
  }

  const [existingAdmin] = admins;
  if (existingAdmin.username !== LEGACY_ADMIN_USERNAME) {
    return false;
  }

  const usesLegacyPassword = await bcrypt.compare(LEGACY_ADMIN_PASSWORD, existingAdmin.password);
  if (!usesLegacyPassword) {
    return false;
  }

  const hashedPassword = await bcrypt.hash(initialPassword, 12);
  await query(
    'UPDATE admin SET username = ?, password = ? WHERE id_admin = ?',
    [initialUsername, hashedPassword, existingAdmin.id_admin]
  );
  console.log(`✅ Migrated legacy admin account to bootstrap credentials for: ${initialUsername}`);
  return true;
}

// Bootstrap initial admin user
async function bootstrapInitialAdminIfEnabled() {
  try {
    const {
      SEED_ADMIN_ON_STARTUP,
      INITIAL_ADMIN_USERNAME,
      INITIAL_ADMIN_PASSWORD,
    } = env;

    if (!SEED_ADMIN_ON_STARTUP) {
      console.log('ℹ️  Initial admin bootstrap disabled');
      return;
    }

    const validationError = validateInitialAdminBootstrapConfig(INITIAL_ADMIN_USERNAME, INITIAL_ADMIN_PASSWORD);
    if (validationError) {
      throw new Error(validationError);
    }

    const initialUsername = INITIAL_ADMIN_USERNAME.trim();
    const admins = await query('SELECT id_admin, username, password FROM admin ORDER BY id_admin ASC');

    if (!admins || admins.length === 0) {
      const hashedPassword = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, 12);
      await query('INSERT INTO admin (username, password) VALUES (?, ?)', [initialUsername, hashedPassword]);
      console.log(`✅ Bootstrapped initial admin user: ${initialUsername}`);
      return;
    }

    const migratedLegacyAdmin = await migrateLegacyDefaultAdmin(admins, initialUsername, INITIAL_ADMIN_PASSWORD);
    if (migratedLegacyAdmin) {
      return;
    }

    console.log('ℹ️  Initial admin bootstrap skipped because admin accounts already exist');
  } catch (error) {
    console.error('❌ Initial admin bootstrap failed:', error.message);
    throw error;
  }
}

// ===== SERVER STARTUP =====

let httpServer;
let isShuttingDown = false;

function handleListenError(error) {
  if (error?.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`ℹ️  Another process is already listening on http://localhost:${PORT}`);
    console.error('ℹ️  Stop the existing process or set a different PORT in backend/.env before starting the server again.');
    process.exit(1);
  }

  console.error('❌ Server listen failed:', error);
  process.exit(1);
}

// Startup function
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await ensureDatabaseConnection();
    if (!dbConnected) {
      console.error('❌ Cannot start server without database connection');
      process.exit(1);
    }

    if (env.RUN_MIGRATIONS_ON_STARTUP) {
      await runMigrations();
    }

    // Bootstrap initial admin user
    await bootstrapInitialAdminIfEnabled();

    // Start server
    httpServer = app.listen(PORT, '127.0.0.1');

    httpServer.on('error', handleListenError);
    httpServer.on('listening', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Readiness check: http://localhost:${PORT}/api/health/ready`);
      console.log(`📁 Static files: http://localhost:${PORT}/api/uploads`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`🛑 ${signal} received, shutting down gracefully`);

  const forceExitTimer = setTimeout(() => {
    console.error('❌ Graceful shutdown timed out');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }
  await pool.end();
  clearTimeout(forceExitTimer);
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

// PM2 launches ESM applications through its process container and exposes the
// actual application entrypoint through pm_exec_path. Direct Node execution
// continues to use process.argv[1], while imports from tests remain inactive.
const mainModulePath = process.env.pm_exec_path || process.argv[1];
const isMainModule = mainModulePath
  && import.meta.url === pathToFileURL(path.resolve(mainModulePath)).href;

if (isMainModule) {
  startServer();
}

export {
  app,
  bootstrapInitialAdminIfEnabled,
  ensureDatabaseConnection,
  getPagination,
  runMigrations,
  startServer,
};
