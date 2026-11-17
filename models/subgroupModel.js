import mongoose from 'mongoose';

const subgroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du groupe est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['Voyage', 'Restaurant', 'Sortie', 'Activité Commune', 'Autre'],
    required: [true, 'Le type d\'activité est requis']
  },
  startDate: {
    type: Date,
    required: [true, 'La date de début est requise']
  },
  endDate: {
    type: Date,
    required: [true, 'La date de fin est requise']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['Actif', 'Archivé'],
    default: 'Actif'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Subgroup = mongoose.model('Subgroup', subgroupSchema);

export default Subgroup;
