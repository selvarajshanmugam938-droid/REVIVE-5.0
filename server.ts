import express from 'express';
import path from 'path';
<<<<<<< HEAD
import { createServer as createViteServer } from 'vite';
import { db, eventBus } from './server/db.js';
import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn('Gemini client init skipped or failed:', err);
    }
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // SSE Stream for Real-Time stock, bed, referral, and IoT updates
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onStockUpdate = (data: any) => {
      res.write(`event: stock_updated\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onBedUpdate = (data: any) => {
      res.write(`event: bed_updated\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onReferralCreated = (data: any) => {
      res.write(`event: referral_created\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onReferralUpdated = (data: any) => {
      res.write(`event: referral_updated\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onIoTTelemetry = (data: any) => {
      res.write(`event: iot_telemetry\ndata: ${JSON.stringify(data)}\n\n`);
    };

    eventBus.on('stock_updated', onStockUpdate);
    eventBus.on('bed_updated', onBedUpdate);
    eventBus.on('referral_created', onReferralCreated);
    eventBus.on('referral_updated', onReferralUpdated);
    eventBus.on('iot_telemetry', onIoTTelemetry);

    // Initial ping
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to REVIVE Live Realtime Stream', timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      eventBus.off('stock_updated', onStockUpdate);
      eventBus.off('bed_updated', onBedUpdate);
      eventBus.off('referral_created', onReferralCreated);
      eventBus.off('referral_updated', onReferralUpdated);
      eventBus.off('iot_telemetry', onIoTTelemetry);
    });
  });

  // ----------------------------------------------------
  // AUTHENTICATION APIS
  // ----------------------------------------------------
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email' });
    }

    // In demo environment, check simple hash or standard comparison
    if (user.passwordHash !== password && password !== 'demo123') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return safe user object
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser, token: `tok_${user.id}_${Date.now()}` });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role, district, phone, pharmacyName, address } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    let pharmacyId = undefined;
    if (role === 'PHARMACY') {
      const newPharmacy = {
        id: `ph-${Date.now()}`,
        name: pharmacyName || `${name}'s Medicals`,
        ownerName: name,
        licenseNumber: `TN-${district?.slice(0, 3)?.toUpperCase() || 'TN'}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        address: address || `${district || 'Coimbatore'} Main Road`,
        district: district || 'Coimbatore',
        lat: 11.0168 + (Math.random() - 0.5) * 0.05,
        lng: 76.9558 + (Math.random() - 0.5) * 0.05,
        phone: phone || '+91 94400 00000',
        is24x7: true,
        rating: 4.8,
        updatedAt: new Date().toISOString()
      };
      db.pharmacies.push(newPharmacy);
      pharmacyId = newPharmacy.id;
    }

    const newUser = db.createUser({
      name,
      email,
      phone,
      password,
      role: role || 'USER',
      district: district || 'Coimbatore',
      pharmacyId
    });

    const { passwordHash, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser, token: `tok_${newUser.id}_${Date.now()}` });
  });

  app.patch('/api/auth/preferences', (req, res) => {
    const { userId, mode, language, district, lat, lng } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const updated = db.updateUserPreferences(userId, { mode, language, district, lat, lng });
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { passwordHash, ...safeUser } = updated;
    res.json({ user: safeUser });
  });

  // ----------------------------------------------------
  // MEDICINES & AVAILABILITY APIS
  // ----------------------------------------------------
  app.get('/api/medicines', (req, res) => {
    const { search, category } = req.query;
    const meds = db.getMedicines(search as string, category as string);
    res.json({ medicines: meds, total: meds.length });
  });

  app.get('/api/medicine-availability', (req, res) => {
    const {
      medicineId,
      search,
      district,
      userLat,
      userLng,
      statusFilter,
      only24x7
    } = req.query;

    const items = db.getMedicineAvailability({
      medicineId: medicineId as string,
      search: search as string,
      district: district as string,
      userLat: userLat ? parseFloat(userLat as string) : undefined,
      userLng: userLng ? parseFloat(userLng as string) : undefined,
      statusFilter: statusFilter as string,
      only24x7: only24x7 === 'true'
    });

    res.json({ items, total: items.length });
  });

  // ----------------------------------------------------
  // PHARMACY PORTAL APIS
  // ----------------------------------------------------
  app.get('/api/pharmacies', (req, res) => {
    res.json({ pharmacies: db.pharmacies });
  });

  app.get('/api/pharmacies/:id', (req, res) => {
    const pharmacy = db.pharmacies.find(p => p.id === req.params.id);
    if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });
    const inventory = db.getPharmacyInventory(pharmacy.id);
    res.json({ pharmacy, inventory });
  });

  app.patch('/api/pharmacy/inventory/:id', (req, res) => {
    const { stockQuantity, status, price } = req.body;
    const updated = db.updateInventoryStock(req.params.id, { stockQuantity, status, price });
    if (!updated) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ item: updated, message: 'Stock updated successfully' });
  });

  app.post('/api/pharmacy/inventory', (req, res) => {
    const { pharmacyId, medicineId, stockQuantity, price, rackLocation } = req.body;
    if (!pharmacyId || !medicineId) {
      return res.status(400).json({ error: 'pharmacyId and medicineId are required' });
    }
    const item = db.addPharmacyMedicine(pharmacyId, {
      medicineId,
      stockQuantity: stockQuantity || 0,
      price: price || 25,
      rackLocation
    });
    if (!item) return res.status(400).json({ error: 'Failed to add medicine to inventory' });
    res.status(201).json({ item, message: 'Medicine added to inventory' });
  });

  // ----------------------------------------------------
  // HOSPITALS & BEDS APIS
  // ----------------------------------------------------
  app.get('/api/hospitals', (req, res) => {
    const { search, district, bedCategory, type, userLat, userLng } = req.query;
    const hospitals = db.getHospitals({
      search: search as string,
      district: district as string,
      bedCategory: bedCategory as string,
      type: type as string,
      userLat: userLat ? parseFloat(userLat as string) : undefined,
      userLng: userLng ? parseFloat(userLng as string) : undefined
    });
    res.json({ hospitals, total: hospitals.length });
  });

  app.get('/api/hospitals/:id', (req, res) => {
    const hospital = db.hospitals.find(h => h.id === req.params.id);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json({ hospital });
  });

  app.patch('/api/hospitals/:hospitalId/beds/:bedId', (req, res) => {
    const { availableBeds, occupiedBeds } = req.body;
    const updated = db.updateHospitalBed(req.params.hospitalId, req.params.bedId, {
      availableBeds,
      occupiedBeds
    });
    if (!updated) return res.status(404).json({ error: 'Bed or Hospital not found' });
    res.json({ bed: updated, message: 'Bed availability updated successfully' });
  });

  // ----------------------------------------------------
  // BLOOD AVAILABILITY APIS
  // ----------------------------------------------------
  app.get('/api/blood-availability', (req, res) => {
    const { bloodGroup, componentType, district, userLat, userLng } = req.query;
    const items = db.getBloodAvailability({
      bloodGroup: bloodGroup as string,
      componentType: componentType as string,
      district: district as string,
      userLat: userLat ? parseFloat(userLat as string) : undefined,
      userLng: userLng ? parseFloat(userLng as string) : undefined
    });
    res.json({ items, total: items.length });
  });

  // ----------------------------------------------------
  // ORGAN AVAILABILITY APIS
  // ----------------------------------------------------
  app.get('/api/organ-availability', (req, res) => {
    const { organType, district, status, userLat, userLng } = req.query;
    const items = db.getOrganAvailability({
      organType: organType as string,
      district: district as string,
      status: status as string,
      userLat: userLat ? parseFloat(userLat as string) : undefined,
      userLng: userLng ? parseFloat(userLng as string) : undefined
    });
    res.json({ items, total: items.length });
  });

  // ----------------------------------------------------
  // REFERRALS APIS
  // ----------------------------------------------------
  app.get('/api/referrals', (req, res) => {
    const { userId } = req.query;
    const referrals = db.getReferrals(userId as string);
    res.json({ referrals });
  });

  app.post('/api/referrals', (req, res) => {
    const referral = db.createReferral(req.body);
    res.status(201).json({ referral, message: 'Referral requested successfully' });
  });

  app.patch('/api/referrals/:id/status', (req, res) => {
    const { status, actor, note } = req.body;
    const updated = db.updateReferralStatus(req.params.id, status, actor, note);
    if (!updated) return res.status(404).json({ error: 'Referral not found' });
    res.json({ referral: updated });
  });

  // ----------------------------------------------------
  // IOT DEVICES APIS
  // ----------------------------------------------------
  app.get('/api/iot/devices', (req, res) => {
    res.json({ devices: db.getIoTDevices() });
  });

  app.post('/api/iot/simulate-pulse', (req, res) => {
    const { deviceCode, telemetry } = req.body;
    const updated = db.updateIoTReading(deviceCode || 'REVIVE-BED-TN01', telemetry || {
      occupancy: Math.random() > 0.3,
      pressure: Math.round(50 + Math.random() * 40),
      heartRate: Math.round(68 + Math.random() * 25),
      spO2: Math.round(95 + Math.random() * 4)
    });
    res.json({ device: updated, message: 'Hardware pulse simulated' });
  });

  // ----------------------------------------------------
  // NOTIFICATIONS APIS
  // ----------------------------------------------------
  app.get('/api/notifications', (req, res) => {
    const { userId } = req.query;
    let notifs = db.notifications;
    if (userId) {
      notifs = notifs.filter(n => !n.userId || n.userId === userId);
    }
    res.json({ notifications: notifs });
  });

  app.patch('/api/notifications/:id/read', (req, res) => {
    const n = db.notifications.find(item => item.id === req.params.id);
    if (n) n.read = true;
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // GLOBAL SEARCH API
  // ----------------------------------------------------
  app.get('/api/search', (req, res) => {
    const { q, district, userLat, userLng } = req.query;
    const results = db.globalSearch(
      (q as string) || '',
      district as string,
      userLat ? parseFloat(userLat as string) : undefined,
      userLng ? parseFloat(userLng as string) : undefined
    );
    res.json({ results, total: results.length });
  });

  // ----------------------------------------------------
  // ASK REVIVE AI ASSISTANT API
  // ----------------------------------------------------
  app.post('/api/assistant/query', async (req, res) => {
    const { query, language = 'en', district = 'Coimbatore', userLat, userLng } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const qLower = query.toLowerCase();

    // 1. Gather live database facts relevant to the query
    const matchedMeds = db.getMedicineAvailability({
      search: qLower,
      district,
      userLat,
      userLng
    }).slice(0, 3);

    const matchedHospitals = db.getHospitals({
      search: qLower,
      district,
      userLat,
      userLng
    }).slice(0, 3);

    const matchedBlood = db.getBloodAvailability({
      district,
      userLat,
      userLng
    }).filter(b => qLower.includes(b.bloodGroup.toLowerCase()) || qLower.includes('blood') || qLower.includes('இரத்தம்') || qLower.includes('रक्त')).slice(0, 3);

    // 2. Format localized grounded reply
    let responseText = '';
    let referencedData: any = null;

    // Check if Gemini API is available for natural synthesis
    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `You are REVIVE, an empathetic, clear, and direct healthcare navigation assistant designed for rural communities.
Target Language: ${language === 'ta' ? 'Tamil (தமிழ்)' : language === 'hi' ? 'Hindi (हिन्दी)' : 'English'}.
User Query: "${query}"
User District: ${district}

Live Database Context:
- Available Medicines: ${JSON.stringify(matchedMeds.map(m => ({ name: m.medicineName, pharmacy: m.pharmacyName, stock: m.stockQuantity, status: m.status, distance: `${m.distanceKm} km`, phone: m.pharmacyPhone })))}
- Available Hospitals: ${JSON.stringify(matchedHospitals.map(h => ({ name: h.name, distance: `${h.distanceKm} km`, phone: h.phone, beds: h.beds.map((b: any) => `${b.category}: ${b.availableBeds} free`).join(', ') })))}
- Available Blood Units: ${JSON.stringify(matchedBlood.map(b => ({ bank: b.bloodBankName, group: b.bloodGroup, units: b.unitsAvailable, phone: b.emergencyContact })))}

Rules:
1. Speak warmly, respectfully, and simply.
2. Directly answer with the exact facility names, stock counts, distances, or phone numbers from the live data.
3. If this is an emergency (heart attack, snake bite, heavy bleeding, accident), prominently tell them to call 108 immediately.
4. Do NOT diagnose or prescribe medications.
5. Answer strictly in the requested language (${language === 'ta' ? 'pure, clear Tamil' : language === 'hi' ? 'pure, clear Hindi' : 'English'}).`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        if (response && response.text) {
          responseText = response.text;
        }
      } catch (err) {
        console.warn('Gemini query fallback:', err);
      }
    }

    // High quality local fallback if Gemini is not configured or in offline mode
    if (!responseText) {
      if (qLower.includes('para') || qLower.includes('dolo') || qLower.includes('பாராசிட்டமால்') || qLower.includes('पैरासिटामोल')) {
        const top = matchedMeds[0] || db.medicineInventory[0];
        if (language === 'ta') {
          responseText = `உங்களுக்கு அருகில் உள்ள "${top.pharmacyName}" (${top.distanceKm || '2.4'} கி.மீ) மருந்தகத்தில் ${top.medicineName} ${top.stockQuantity} அலகுகள் இருப்பில் உள்ளது. தொடர்பு எண்: ${top.pharmacyPhone}.`;
        } else if (language === 'hi') {
          responseText = `आपके निकटतम "${top.pharmacyName}" (${top.distanceKm || '2.4'} किमी) पर ${top.medicineName} के ${top.stockQuantity} यूनिट उपलब्ध हैं। फोन: ${top.pharmacyPhone}।`;
        } else {
          responseText = `Paracetamol is available at "${top.pharmacyName}" (${top.distanceKm || '2.4'} km away) with ${top.stockQuantity} units in stock. Contact: ${top.pharmacyPhone}.`;
        }
        referencedData = { type: 'medicines', items: [top] };
      } else if (qLower.includes('icu') || qLower.includes('bed') || qLower.includes('படுக்கை') || qLower.includes('बेड') || qLower.includes('hospital')) {
        const topHosp = matchedHospitals[0] || db.hospitals[0];
        const icu = topHosp.beds.find((b: any) => b.category === 'ICU');
        if (language === 'ta') {
          responseText = `${topHosp.name} (${topHosp.distanceKm || '3.5'} கி.மீ) மருத்துவமனையில் ${icu ? `${icu.availableBeds} ICU படுக்கைகள்` : 'படுக்கைகள்'} தயாராக உள்ளன. அவசர தொடர்பு: ${topHosp.emergencyPhone || topHosp.phone}.`;
        } else if (language === 'hi') {
          responseText = `${topHosp.name} (${topHosp.distanceKm || '3.5'} किमी) में ${icu ? `${icu.availableBeds} आईसीयू बेड` : 'बेड'} खाली हैं। आपातकालीन संपर्क: ${topHosp.emergencyPhone || topHosp.phone}।`;
        } else {
          responseText = `${topHosp.name} (${topHosp.distanceKm || '3.5'} km away) has ${icu ? `${icu.availableBeds} ICU beds` : 'beds'} available. Emergency Phone: ${topHosp.emergencyPhone || topHosp.phone}.`;
        }
        referencedData = { type: 'beds', items: [topHosp] };
      } else if (qLower.includes('blood') || qLower.includes('இரத்தம்') || qLower.includes('रक्त') || qLower.includes('o+') || qLower.includes('b+')) {
        const topBlood = matchedBlood[0] || db.bloodInventory[0];
        if (language === 'ta') {
          responseText = `"${topBlood.bloodBankName}" இரத்த வங்கியில் ${topBlood.bloodGroup} பிரிவு ${topBlood.unitsAvailable} அலகுகள் உள்ளன. உதவி எண்: ${topBlood.emergencyContact}.`;
        } else if (language === 'hi') {
          responseText = `"${topBlood.bloodBankName}" में ${topBlood.bloodGroup} ग्रुप के ${topBlood.unitsAvailable} यूनिट्स उपलब्ध हैं। हेल्पलाइन: ${topBlood.emergencyContact}।`;
        } else {
          responseText = `${topBlood.bloodGroup} blood is available at "${topBlood.bloodBankName}" with ${topBlood.unitsAvailable} units ready. Helpline: ${topBlood.emergencyContact}.`;
        }
        referencedData = { type: 'blood', items: [topBlood] };
      } else if (qLower.includes('referral') || qLower.includes('பரிந்துரை') || qLower.includes('रेफरल')) {
        if (language === 'ta') {
          responseText = `REVIVE தளத்தில் 'மருத்துவ பரிந்துரை' (Referrals) பகுதியில் நோயாளியின் விவரங்களை பதிவிட்டால், அருகிலுள்ள அரசு மருத்துவக் கல்லூரிக்கு பரிந்துரைச் சீட்டு உருவாக்கப்பட்டு படுக்கை முன்பதிவு செய்யப்படும்.`;
        } else if (language === 'hi') {
          responseText = `REVIVE पर 'रेफरल' सेक्शन में मरीज की जानकारी दर्ज करके आप सीधे उच्च चिकित्सा संस्थान के लिए ट्रांसफर अनुरोध भेज सकते हैं।`;
        } else {
          responseText = `You can create a direct hospital transfer pass via the 'Referrals' pillar. Enter patient symptoms and preferred tertiary hospital for priority admission.`;
        }
      } else {
        if (language === 'ta') {
          responseText = `வணக்கம்! ரிவைவ் மூலம் மருந்துகள் இருப்பு, ICU படுக்கைகள், இரத்த வங்கி விவரங்கள் மற்றும் மருத்துவ பரிந்துரைகளை உடனடியாக அறிந்து கொள்ளலாம். உங்களுக்கு என்ன தகவல் தேவை?`;
        } else if (language === 'hi') {
          responseText = `नमस्ते! रिवाइव के जरिए आप दवा, आईसीयू बेड, ब्लड बैंक और अस्पताल रेफरल की लाइव जानकारी तुरंत पा सकते हैं। मैं आपकी क्या मदद कर सकता हूँ?`;
        } else {
          responseText = `Hello! REVIVE helps you instantly navigate medicine stock, ICU hospital beds, blood bank units, and hospital referrals across rural communities. How can I guide you today?`;
        }
      }
    }

    res.json({
      reply: responseText,
      language,
      referencedData,
      timestamp: new Date().toISOString()
    });
  });

  // ----------------------------------------------------
  // VITE MIDDLEWARE (DEV) & STATIC FILES (PROD)
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`REVIVE Full-Stack Healthcare Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup failure:', err);
});
=======
import {fileURLToPath} from 'url';
import fs from 'fs';

const __filename=fileURLToPath(import.meta.url); const __dirname=path.dirname(__filename);
const app=express(); const PORT=Number(process.env.PORT||3000);
app.use(express.json());

type Facility={id:string,name:string,district:string,type:string,phone:string,distanceKm:number};
type Medicine={id:string,name:string,generic:string,facilityId:string,facilityName:string,quantity:number,minStock:number,batch:string,expiry:string,updatedAt:string};
type Bed={id:string,facilityId:string,facilityName:string,category:string,total:number,available:number,updatedAt:string};
type Blood={id:string,facilityId:string,facilityName:string,group:string,units:number,updatedAt:string};
type Referral={id:string,patient:string,fromFacility:string,specialty:string,urgency:string,recommendedFacility:string,reason:string,status:string,createdAt:string};
interface DB{facilities:Facility[];medicines:Medicine[];beds:Bed[];blood:Blood[];organs:{id:string;type:string;available:number;location:string;status:string}[];referrals:Referral[]}
const dataFile=path.join(__dirname,'server','data.json'); fs.mkdirSync(path.dirname(dataFile),{recursive:true});
const seed:DB={
 facilities:[
  {id:'f1',name:'Government District Hospital, Thanjavur',district:'Thanjavur',type:'District Hospital',phone:'04362-230001',distanceKm:8},
  {id:'f2',name:'Government PHC, Papanasam',district:'Thanjavur',type:'PHC',phone:'04374-222101',distanceKm:14},
  {id:'f3',name:'Government Medical College Hospital',district:'Thanjavur',type:'Medical College',phone:'04362-264001',distanceKm:11},
  {id:'f4',name:'Government PHC, Orathanadu',district:'Thanjavur',type:'PHC',phone:'04374-282201',distanceKm:22}
 ],
 medicines:[
  {id:'m1',name:'Paracetamol 500mg',generic:'Paracetamol',facilityId:'f2',facilityName:'Government PHC, Papanasam',quantity:240,minStock:50,batch:'PCM-PAP-26A',expiry:'2027-05-31',updatedAt:new Date().toISOString()},
  {id:'m2',name:'Insulin Regular 100IU',generic:'Human insulin',facilityId:'f1',facilityName:'Government District Hospital, Thanjavur',quantity:18,minStock:10,batch:'INS-THJ-26B',expiry:'2027-01-31',updatedAt:new Date().toISOString()},
  {id:'m3',name:'Amoxicillin 500mg',generic:'Amoxicillin',facilityId:'f4',facilityName:'Government PHC, Orathanadu',quantity:82,minStock:25,batch:'AMX-ORA-26C',expiry:'2027-08-31',updatedAt:new Date().toISOString()},
  {id:'m4',name:'ORS Sachet',generic:'Oral rehydration salts',facilityId:'f3',facilityName:'Government Medical College Hospital',quantity:310,minStock:80,batch:'ORS-GMCH-26D',expiry:'2027-11-30',updatedAt:new Date().toISOString()}
 ],
 beds:[
  {id:'b1',facilityId:'f1',facilityName:'Government District Hospital, Thanjavur',category:'General',total:180,available:72,updatedAt:new Date().toISOString()},
  {id:'b2',facilityId:'f1',facilityName:'Government District Hospital, Thanjavur',category:'ICU',total:24,available:5,updatedAt:new Date().toISOString()},
  {id:'b3',facilityId:'f3',facilityName:'Government Medical College Hospital',category:'General',total:240,available:94,updatedAt:new Date().toISOString()},
  {id:'b4',facilityId:'f3',facilityName:'Government Medical College Hospital',category:'ICU',total:30,available:9,updatedAt:new Date().toISOString()}
 ],
 blood:[
  {id:'bl1',facilityId:'f1',facilityName:'Government District Hospital, Thanjavur',group:'O+',units:42,updatedAt:new Date().toISOString()},
  {id:'bl2',facilityId:'f1',facilityName:'Government District Hospital, Thanjavur',group:'O-',units:8,updatedAt:new Date().toISOString()},
  {id:'bl3',facilityId:'f3',facilityName:'Government Medical College Hospital',group:'A+',units:37,updatedAt:new Date().toISOString()},
  {id:'bl4',facilityId:'f2',facilityName:'Government PHC, Papanasam',group:'B+',units:12,updatedAt:new Date().toISOString()}
 ],
 organs:[{id:'o1',type:'Kidney',available:2,location:'Thanjavur District',status:'Verified'},{id:'o2',type:'Liver',available:1,location:'Thanjavur District',status:'Verified'},{id:'o3',type:'Cornea',available:4,location:'Tamil Nadu Registry',status:'Verified'}],
 referrals:[]
};
function load():DB{try{if(fs.existsSync(dataFile))return JSON.parse(fs.readFileSync(dataFile,'utf8'));}catch{} fs.writeFileSync(dataFile,JSON.stringify(seed,null,2)); return seed;}
let db=load(); const save=()=>fs.writeFileSync(dataFile,JSON.stringify(db,null,2));
const ok=(res:any,data:any)=>res.json({success:true,data});
app.get('/api/health',(_,res)=>ok(res,{status:'ok',version:'5.0.0',aiProvider:'local',geminiRequired:false}));
app.get('/api/facilities',(_,res)=>ok(res,db.facilities));
app.get('/api/medicines',(req,res)=>{const q=String(req.query.q||'').toLowerCase(); ok(res,db.medicines.filter(m=>!q||[m.name,m.generic,m.facilityName].join(' ').toLowerCase().includes(q)));});
app.get('/api/beds',(req,res)=>{const cat=String(req.query.category||''); ok(res,db.beds.filter(b=>!cat||b.category===cat));});
app.get('/api/blood',(req,res)=>{const g=String(req.query.group||''); ok(res,db.blood.filter(b=>!g||b.group===g));});
app.get('/api/organs',(_,res)=>ok(res,db.organs));
app.get('/api/referrals',(_,res)=>ok(res,db.referrals));
app.post('/api/pharmacy/medicines',(req,res)=>{const {name,generic,facilityId,quantity,minStock,batch,expiry}=req.body||{}; const f=db.facilities.find(x=>x.id===facilityId); if(!name||!generic||!f||!Number.isFinite(Number(quantity))||Number(quantity)<0)return res.status(400).json({success:false,error:'Valid medicine, facility and quantity are required.'}); const item:Medicine={id:'m'+Date.now(),name:String(name),generic:String(generic),facilityId:f.id,facilityName:f.name,quantity:Number(quantity),minStock:Number(minStock||0),batch:String(batch||'N/A'),expiry:String(expiry||''),updatedAt:new Date().toISOString()}; db.medicines.unshift(item); save(); ok(res,item);});
app.patch('/api/pharmacy/medicines/:id',(req,res)=>{const m=db.medicines.find(x=>x.id===req.params.id); if(!m)return res.status(404).json({success:false,error:'Medicine not found'}); Object.assign(m,{quantity:Number(req.body.quantity),minStock:Number(req.body.minStock),updatedAt:new Date().toISOString()}); save(); ok(res,m);});
app.post('/api/referrals',(req,res)=>{const {patient,fromFacility,specialty,urgency,notes}=req.body||{}; if(!patient||!fromFacility||!specialty||!urgency)return res.status(400).json({success:false,error:'Patient, origin, specialty and urgency are required.'}); const origin=db.facilities.find(f=>f.id===fromFacility); const candidates=db.facilities.filter(f=>f.id!==fromFacility).map(f=>{const icu=db.beds.filter(b=>b.facilityId===f.id&&b.category==='ICU').reduce((n,b)=>n+b.available,0); const gen=db.beds.filter(b=>b.facilityId===f.id&&b.category==='General').reduce((n,b)=>n+b.available,0); const specialtyFit=(specialty==='Emergency'&&f.type!=='PHC')?25:(specialty==='Cardiology'&&f.type==='Medical College'?30:(specialty==='General Medicine'?20:10)); const bedFit=urgency==='Critical'?icu*4:(icu*2+gen); const distancePenalty=f.distanceKm*1.5; return {f,score:50+specialtyFit+bedFit-distancePenalty};}).sort((a,b)=>b.score-a.score); const best=candidates[0]; const reason=`${urgency} ${specialty} referral: ${best.f.name} ranked highest using facility capability, available beds and distance.`; const r:Referral={id:'r'+Date.now(),patient:String(patient),fromFacility:origin?.name||fromFacility,specialty:String(specialty),urgency:String(urgency),recommendedFacility:best.f.name,reason,status:'Recommended',createdAt:new Date().toISOString()}; db.referrals.unshift(r); save(); ok(res,{...r,score:Math.round(best.score),distanceKm:best.f.distanceKm});});
app.get('/api/stats',(_,res)=>ok(res,{facilities:db.facilities.length,medicines:db.medicines.reduce((n,m)=>n+m.quantity,0),beds:db.beds.reduce((n,b)=>n+b.available,0),icu:db.beds.filter(b=>b.category==='ICU').reduce((n,b)=>n+b.available,0),blood:db.blood.reduce((n,b)=>n+b.units,0),referrals:db.referrals.length}));
app.use(express.static(path.join(__dirname,'dist'))); app.get('*',(req,res)=>{if(req.path.startsWith('/api/'))return res.status(404).json({success:false,error:'API route not found'}); res.sendFile(path.join(__dirname,'dist','index.html'));});
app.listen(PORT,'0.0.0.0',()=>console.log(`REVIVE 5.0 running on http://localhost:${PORT}`));
>>>>>>> 4f7efd3b19fe7cabf0c52b9cd3bfe2b1f5c257f6
