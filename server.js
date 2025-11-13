// ============================================
// KAARD FARM MANAGEMENT SYSTEM - BACKEND
// ============================================
// Complete Node.js + Express + MongoDB Backend
// Ready for Production Deployment
// Developer: Advent Tatenda Shumba
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================
app.use(cors({
  origin: ['https://kaard-farm.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// DATABASE CONNECTION
// ============================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://koryaugust29_db_user:yzaXX1YcSD3npnJH@cluster0.1qqhk85.mongodb.net/farmdb?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
  console.log('Database: farmdb');
})
.catch((err) => {
  console.error('MongoDB Connection Error:', err.message);
  console.log('Tip: Check your connection string and IP whitelist');
  process.exit(1);
});

// ============================================
// DATABASE SCHEMAS (Models)
// ============================================

// 1. USER SCHEMA - For authentication
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'viewer'],
    default: 'admin'
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// 2. CROP SCHEMA - Inventory management
const cropSchema = new mongoose.Schema({
  cropName: { 
    type: String, 
    required: true,
    trim: true
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 0
  },
  unit: { 
    type: String, 
    default: 'kg',
    enum: ['kg', 'tons', 'bags', 'bales']
  },
  storageLocation: {
    type: String,
    trim: true
  },
  harvestDate: {
    type: Date
  },
  status: { 
    type: String, 
    default: 'In Stock',
    enum: ['In Stock', 'Low Stock', 'Sold', 'Reserved']
  }
}, { timestamps: true });

const Crop = mongoose.model('Crop', cropSchema);

// 3. EQUIPMENT SCHEMA
const equipmentSchema = new mongoose.Schema({
  equipmentName: { 
    type: String, 
    required: true,
    trim: true
  },
  equipmentType: {
    type: String,
    enum: ['Tractor', 'Harvester', 'Plow', 'Irrigation', 'Sprayer', 'Other']
  },
  condition: { 
    type: String, 
    default: 'Working',
    enum: ['Working', 'Needs Repair', 'Broken', 'Under Maintenance']
  },
  lastMaintenance: {
    type: Date
  },
  nextMaintenance: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const Equipment = mongoose.model('Equipment', equipmentSchema);

// 4. PRODUCTION SCHEMA
const productionSchema = new mongoose.Schema({
  fieldNumber: { 
    type: String,
    required: true,
    trim: true
  },
  cropType: { 
    type: String,
    required: true,
    trim: true
  },
  plantingDate: { 
    type: Date,
    required: true
  },
  harvestDate: {
    type: Date
  },
  areaHectares: { 
    type: Number,
    required: true,
    min: 0
  },
  yieldAmount: { 
    type: Number,
    min: 0
  },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', '']
  },
  notes: {
    type: String
  }
}, { timestamps: true });

const Production = mongoose.model('Production', productionSchema);

// 5. VEHICLE SCHEMA - GPS Tracking
const vehicleSchema = new mongoose.Schema({
  vehicleName: { 
    type: String, 
    required: true,
    trim: true
  },
  registration: {
    type: String,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['Tractor', 'Truck', 'Van', 'Pickup', 'Other']
  },
  currentLat: { 
    type: Number, 
    default: -18.9166
  },
  currentLng: { 
    type: Number, 
    default: 29.8166
  },
  status: { 
    type: String, 
    default: 'Idle',
    enum: ['Idle', 'Active', 'Maintenance', 'Out of Service']
  },
  fuelLevel: { 
    type: Number, 
    default: 100,
    min: 0,
    max: 100
  },
  driverName: {
    type: String,
    trim: true
  },
  lastUpdate: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

// ============================================
// API ROUTES
// ============================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kaard Farm Management API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      auth: '/api/login, /api/setup-admin',
      crops: '/api/crops',
      equipment: '/api/equipment',
      production: '/api/production',
      vehicles: '/api/vehicles',
      stats: '/api/stats'
    }
  });
});

// TEST ROUTE - to verify routes are working
app.get('/api/test', (req, res) => {
  res.json({ message: 'TEST ROUTE WORKS!' });
});

app.post('/api/test-post', (req, res) => {
  res.json({ message: 'POST ROUTE WORKS!' });
});

// GET version for browser testing
app.get('/api/setup-admin', async (req, res) => {
  console.log('Setup admin GET route hit!');
  
  try {
    const existingUser = await User.findOne({ username: 'admin' });
    
    if (existingUser) {
      return res.json({ 
        message: 'Admin already exists',
        credentials: 'username: admin, password: admin123'
      });
    }

    const admin = new User({ 
      username: 'admin', 
      password: 'admin123',
      role: 'admin'
    });
    
    await admin.save();
    
    res.json({ 
      message: 'Admin created successfully!',
      credentials: 'username: admin, password: admin123'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --------------------------------------------
// AUTHENTICATION ROUTES
// --------------------------------------------

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password required' 
      });
    }

    const user = await User.findOne({ username, password });
    
    if (user) {
      res.json({ 
        success: true, 
        message: 'Login successful', 
        username: user.username,
        role: user.role
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during login' 
    });
  }
});

// Setup admin user (run once)
app.post('/api/setup-admin', async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: 'admin' });
    
    if (existingUser) {
      return res.json({ 
        message: 'Admin user already exists',
        credentials: 'username: admin, password: admin123'
      });
    }

    const admin = new User({ 
      username: 'admin', 
      password: 'admin123',
      role: 'admin'
    });
    
    await admin.save();
    
    res.json({ 
      message: 'Admin user created successfully',
      credentials: 'username: admin, password: admin123'
    });
  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// --------------------------------------------
// CROP ROUTES
// --------------------------------------------

app.get('/api/crops', async (req, res) => {
  try {
    const crops = await Crop.find().sort({ createdAt: -1 });
    res.json(crops);
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

app.post('/api/crops', async (req, res) => {
  try {
    const crop = new Crop(req.body);
    await crop.save();
    res.status(201).json(crop);
  } catch (error) {
    console.error('Add crop error:', error);
    res.status(500).json({ error: 'Failed to add crop' });
  }
});

app.put('/api/crops/:id', async (req, res) => {
  try {
    const crop = await Crop.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    
    res.json(crop);
  } catch (error) {
    console.error('Update crop error:', error);
    res.status(500).json({ error: 'Failed to update crop' });
  }
});

app.delete('/api/crops/:id', async (req, res) => {
  try {
    const crop = await Crop.findByIdAndDelete(req.params.id);
    
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    
    res.json({ message: 'Crop deleted successfully' });
  } catch (error) {
    console.error('Delete crop error:', error);
    res.status(500).json({ error: 'Failed to delete crop' });
  }
});

// --------------------------------------------
// EQUIPMENT ROUTES
// --------------------------------------------

app.get('/api/equipment', async (req, res) => {
  try {
    const equipment = await Equipment.find().sort({ createdAt: -1 });
    res.json(equipment);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

app.post('/api/equipment', async (req, res) => {
  try {
    const equipment = new Equipment(req.body);
    await equipment.save();
    res.status(201).json(equipment);
  } catch (error) {
    console.error('Add equipment error:', error);
    res.status(500).json({ error: 'Failed to add equipment' });
  }
});

app.put('/api/equipment/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json(equipment);
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

app.delete('/api/equipment/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

// --------------------------------------------
// PRODUCTION ROUTES
// --------------------------------------------

app.get('/api/production', async (req, res) => {
  try {
    const production = await Production.find().sort({ plantingDate: -1 });
    res.json(production);
  } catch (error) {
    console.error('Get production error:', error);
    res.status(500).json({ error: 'Failed to fetch production records' });
  }
});

app.post('/api/production', async (req, res) => {
  try {
    const production = new Production(req.body);
    await production.save();
    res.status(201).json(production);
  } catch (error) {
    console.error('Add production error:', error);
    res.status(500).json({ error: 'Failed to add production record' });
  }
});

app.put('/api/production/:id', async (req, res) => {
  try {
    const production = await Production.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!production) {
      return res.status(404).json({ error: 'Production record not found' });
    }
    
    res.json(production);
  } catch (error) {
    console.error('Update production error:', error);
    res.status(500).json({ error: 'Failed to update production record' });
  }
});

app.delete('/api/production/:id', async (req, res) => {
  try {
    const production = await Production.findByIdAndDelete(req.params.id);
    
    if (!production) {
      return res.status(404).json({ error: 'Production record not found' });
    }
    
    res.json({ message: 'Production record deleted successfully' });
  } catch (error) {
    console.error('Delete production error:', error);
    res.status(500).json({ error: 'Failed to delete production record' });
  }
});

// --------------------------------------------
// VEHICLE ROUTES
// --------------------------------------------

app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Add vehicle error:', error);
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
});

app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(vehicle);
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

app.put('/api/vehicles/:id/location', async (req, res) => {
  try {
    const { currentLat, currentLng } = req.body;
    
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { 
        currentLat, 
        currentLng, 
        lastUpdate: Date.now() 
      },
      { new: true }
    );
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(vehicle);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update vehicle location' });
  }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// --------------------------------------------
// STATISTICS/DASHBOARD ROUTE
// --------------------------------------------

app.get('/api/stats', async (req, res) => {
  try {
    const cropCount = await Crop.countDocuments();
    const equipmentCount = await Equipment.countDocuments();
    const productionCount = await Production.countDocuments();
    const vehicleCount = await Vehicle.countDocuments();
    
    const crops = await Crop.find();
    const totalCropQuantity = crops.reduce((sum, crop) => sum + crop.quantity, 0);
    
    const activeVehicles = await Vehicle.countDocuments({ status: 'Active' });
    
    const equipmentNeedingRepair = await Equipment.countDocuments({ 
      condition: { $in: ['Needs Repair', 'Broken'] } 
    });
    
    res.json({
      cropCount,
      equipmentCount,
      productionCount,
      vehicleCount,
      totalCropQuantity,
      activeVehicles,
      equipmentNeedingRepair
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// --------------------------------------------
// ERROR HANDLING
// --------------------------------------------

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path 
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

// For Vercel deployment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('');
    console.log('================================================');
    console.log('KAARD FARM MANAGEMENT SYSTEM - BACKEND');
    console.log('================================================');
    console.log('Server running on port ' + PORT);
    console.log('API URL: http://localhost:' + PORT);
    console.log('Database: MongoDB Atlas');
    console.log('');
    console.log('Available Endpoints:');
    console.log('   GET  /                    - API info');
    console.log('   POST /api/login           - Login');
    console.log('   POST /api/setup-admin     - Create admin user');
    console.log('   GET  /api/crops           - Get all crops');
    console.log('   GET  /api/equipment       - Get all equipment');
    console.log('   GET  /api/production      - Get production records');
    console.log('   GET  /api/vehicles        - Get all vehicles');
    console.log('   GET  /api/stats           - Get statistics');
    console.log('');
    console.log('Next Steps:');
    console.log('   1. Visit http://localhost:5000/api/setup-admin');
    console.log('   2. Start the frontend application');
    console.log('   3. Login with: admin / admin123');
    console.log('================================================');
    console.log('');
  });
}

// Export for Vercel
module.exports = app;