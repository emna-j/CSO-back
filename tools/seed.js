import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Configuration for dotenv since we are running this script directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import { MONGO_URI } from "../config.js";

// Models
import User from "../models/userModel.js";
import Oeuvre from "../models/oeuvreModel.js";
import Concert from "../models/concertModel.js";
import Repetition from "../models/repetitionModel.js";

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected. Clearing existing data...");

    await User.deleteMany({});
    await Oeuvre.deleteMany({});
    await Concert.deleteMany({});
    await Repetition.deleteMany({});
    
    console.log("Database cleared. Generating new data...");

    const passwordHash = await bcrypt.hash("password123", 10);

    // ==========================================
    // 1. CREATE USERS
    // ==========================================
    console.log("Creating staff and main users...");

    const managerUser = new User({
      firstName: "Emna", lastName: "Jouini", email: "emnajouini02@gmail.com", password: passwordHash, role: "manager", status: "Sénior", emailConfirmed: true, gender: "Femme"
    });
    
    const mainChoriste = new User({
      firstName: "Oumayma", lastName: "Jouini", email: "oumaymajouini57@gmail.com", password: passwordHash, role: "choriste", status: "Junior", pupitre: "soprano", memberstatus: "Accepted", emailConfirmed: true, gender: "Femme"
    });

    const adminUser = new User({
      firstName: "Admin", lastName: "Système", email: "admin@choeur.com", password: passwordHash, role: "admin", status: "Vétéran", emailConfirmed: true
    });

    const chefChoeur = new User({
      firstName: "Amine", lastName: "Maestro", email: "amine@choeur.com", password: passwordHash, role: "chef de choeur", status: "Vétéran", emailConfirmed: true
    });

    await User.insertMany([managerUser, mainChoriste, adminUser, chefChoeur]);

    console.log("Creating chefs de pupitre...");
    const chefSoprano = new User({ firstName: "Sarah", lastName: "Soprano", email: "sarah.soprano@choeur.com", password: passwordHash, role: "choriste", status: "Sénior", pupitre: "soprano", memberstatus: "Accepted", isChefDePupitre: true, emailConfirmed: true });
    const chefAlto = new User({ firstName: "Alice", lastName: "Alto", email: "alice.alto@choeur.com", password: passwordHash, role: "choriste", status: "Sénior", pupitre: "alto", memberstatus: "Accepted", isChefDePupitre: true, emailConfirmed: true });
    const chefTenor = new User({ firstName: "Tarek", lastName: "Tenor", email: "tarek.tenor@choeur.com", password: passwordHash, role: "choriste", status: "Sénior", pupitre: "ténor", memberstatus: "Accepted", isChefDePupitre: true, emailConfirmed: true });
    const chefBasse = new User({ firstName: "Bader", lastName: "Basse", email: "bader.basse@choeur.com", password: passwordHash, role: "choriste", status: "Sénior", pupitre: "basse", memberstatus: "Accepted", isChefDePupitre: true, emailConfirmed: true });
    await User.insertMany([chefSoprano, chefAlto, chefTenor, chefBasse]);

    console.log("Creating additional choristes (12 choristes)...");
    const additionalChoristes = [];
    const pupitres = ["soprano", "alto", "ténor", "basse"];
    for (let i = 1; i <= 12; i++) {
      const p = pupitres[i % 4];
      additionalChoristes.push({
        firstName: `Choriste${i}`,
        lastName: `Test${i}`,
        email: `choriste${i}@choeur.com`,
        password: passwordHash,
        role: "choriste",
        status: i % 2 === 0 ? "Junior" : "Sénior",
        pupitre: p,
        memberstatus: "Accepted",
        emailConfirmed: true
      });
    }
    const insertedChoristes = await User.insertMany(additionalChoristes);
    const allChoristes = [mainChoriste, chefSoprano, chefAlto, chefTenor, chefBasse, ...insertedChoristes];
    const choristeIds = allChoristes.map(c => c._id);

    console.log("Creating candidates...");
    const candidates = [
      { firstName: "Candidat", lastName: "Un", email: "candidat1@choeur.com", password: passwordHash, role: "candidate", motivation: "J'adore chanter", memberstatus: "Pending" },
      { firstName: "Candidat", lastName: "Deux", email: "candidat2@choeur.com", password: passwordHash, role: "candidate", motivation: "Je veux rejoindre un super chœur", memberstatus: "TestScheduled", testDate: new Date() },
      { firstName: "Candidat", lastName: "Trois", email: "candidat3@choeur.com", password: passwordHash, role: "candidate", motivation: "Passionné", memberstatus: "Pending" }
    ];
    await User.insertMany(candidates);

    // ==========================================
    // 2. CREATE OEUVRES
    // ==========================================
    console.log("Creating oeuvres...");
    const oeuvre1 = new Oeuvre({
      title: "Requiem en Ré mineur", composers: ["W.A. Mozart"], year: "1791", genre: "Classique", requiresChoir: true,
      pupitreMedia: [{ pupitre: "soprano", partition: "requiem_soprano.pdf" }, { pupitre: "tutti", partition: "requiem_tutti.pdf", audio: "requiem_tutti.mp3" }]
    });
    const oeuvre2 = new Oeuvre({
      title: "Symphonie No 9", composers: ["L.V. Beethoven"], year: "1824", genre: "Symphonique", requiresChoir: true
    });
    const oeuvre3 = new Oeuvre({
      title: "Carmina Burana", composers: ["Carl Orff"], year: "1936", genre: "Classique", requiresChoir: true
    });
    await Oeuvre.insertMany([oeuvre1, oeuvre2, oeuvre3]);

    // ==========================================
    // 3. CREATE CONCERTS
    // ==========================================
    console.log("Creating concerts...");
    
    // Past concert
    const pastConcertDate = new Date();
    pastConcertDate.setDate(pastConcertDate.getDate() - 60); // 2 months ago
    const pastConcert = new Concert({
      title: "Concert d'Hiver",
      dateHeure: pastConcertDate,
      location: "Cité de la Culture",
      programme: [oeuvre1._id, oeuvre3._id],
      availableChoristes: choristeIds,
      finalParticipants: choristeIds
    });
    
    // Future concert
    const futureConcertDate = new Date();
    futureConcertDate.setDate(futureConcertDate.getDate() + 30); // in 30 days
    const futureConcert = new Concert({
      title: "Concert de Gala du Printemps",
      dateHeure: futureConcertDate,
      location: "Théâtre Municipal",
      programme: [oeuvre1._id, oeuvre2._id],
      availableChoristes: choristeIds,
      finalParticipants: choristeIds
    });
    
    await Concert.insertMany([pastConcert, futureConcert]);

    // ==========================================
    // 4. CREATE REPETITIONS
    // ==========================================
    console.log("Creating repetitions...");
    
    // Past repetitions for past concert
    const pastRepDate1 = new Date(pastConcertDate);
    pastRepDate1.setDate(pastRepDate1.getDate() - 14);
    const rep1 = new Repetition({
      date: pastRepDate1, startTime: "18:00", endTime: "20:00", location: "Conservatoire Salle A", concert: pastConcert._id, pupitres: ["soprano", "alto", "ténor", "basse"],
      presentChoristes: choristeIds.slice(0, 15), // First 15 present
      absentChoristes: [{ choriste: choristeIds[15], reason: "Maladie" }, { choriste: choristeIds[16], reason: "Voyage" }]
    });

    const pastRepDate2 = new Date(pastConcertDate);
    pastRepDate2.setDate(pastRepDate2.getDate() - 7);
    const rep2 = new Repetition({
      date: pastRepDate2, startTime: "18:00", endTime: "20:00", location: "Conservatoire Salle A", concert: pastConcert._id, pupitres: ["soprano", "alto", "ténor", "basse"],
      presentChoristes: choristeIds.slice(2, 17), 
      absentChoristes: [{ choriste: choristeIds[0], reason: "Maladie" }, { choriste: choristeIds[1], reason: "Voyage" }]
    });

    // Past repetition for future concert
    const pastRepDate3 = new Date();
    pastRepDate3.setDate(pastRepDate3.getDate() - 7);
    const rep3 = new Repetition({
      date: pastRepDate3, startTime: "18:00", endTime: "20:00", location: "Conservatoire Salle A", concert: futureConcert._id, pupitres: ["soprano", "alto", "ténor", "basse"],
      presentChoristes: choristeIds.slice(0, 14),
      absentChoristes: [{ choriste: chefAlto._id, reason: "Maladie" }, { choriste: chefBasse._id, reason: "Travail" }]
    });

    // Future repetition for future concert
    const futureRepDate = new Date();
    futureRepDate.setDate(futureRepDate.getDate() + 3);
    const rep4 = new Repetition({
      date: futureRepDate, startTime: "19:00", endTime: "21:30", location: "Conservatoire Salle B", concert: futureConcert._id, pupitres: ["soprano", "alto", "ténor", "basse"],
      presentChoristes: [], absentChoristes: []
    });

    await Repetition.insertMany([rep1, rep2, rep3, rep4]);

    console.log("=========================================================");
    console.log("✅ Advanced seed completed successfully! Database is rich and ready.");
    console.log("=========================================================");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
