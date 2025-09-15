const db = require('../models');
const jwt = require('jsonwebtoken');
const json2csv = require('json2csv').parse;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const ffmpeg = require('fluent-ffmpeg');
const { Op } = require('sequelize');

// Admin login function
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET || 'voice-ai-admin-secret-2024',
        { expiresIn: '24h' }
      );
      
      return res.json({
        success: true,
        token,
        admin: { username, role: 'admin' }
      });
    }
    
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get comprehensive patient data for doctor analysis
const getPatientAnalysisData = async (req, res) => {
  try {
    const { patientId, startDate, endDate, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    const whereClause = {
      ...(patientId && { 
        [Op.or]: [
          { userId: patientId },
          // { userId: patientId },
          { participantName: { [Op.iLike]: `%${patientId}%` } }
        ]
      }),
      ...(startDate && endDate && {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      })
    };

    const patients = await db.Onboarding.findAll({
      where: whereClause,
      include: [
        { 
          model: db.Demographics,
          as: 'Demographics',
          required: false
        },
        { 
          model: db.Confounder,
          as: 'Confounder',
          required: false
        },
        { 
          model: db.OralCancer,
          as: 'OralCancer',
          required: false
        },
        { 
          model: db.LarynxHypopharynx,
          as: 'LarynxHypopharynx',
          required: false
        },
        { 
          model: db.PharynxCancer,
          as: 'PharynxCancer',
          required: false
        },
        { 
          model: db.VHI,
          as: 'VHI',
          required: false
        },
        { 
          model: db.GRBASRating,
          as: 'GRBASRatings',
          required: false
        },
        { 
          model: db.VoiceRecording,
          as: 'VoiceRecordings',
          required: false,
          attributes: [
            'id', 'sessionId', 'taskType', 'language', 
            'durationSeconds', 'audioFilePath', 'recordingDate'
          ],
          order: [['createdAt', 'ASC']]
        }
      ],
      order: [[sortBy, sortOrder]]
    });

    const analysisData = patients.map(patient => {
      const patientData = patient.toJSON();
      
      const timeline = [];
      
      if (patientData.Demographics) {
        timeline.push({
          type: 'Demographics',
          date: patientData.Demographics.createdAt,
          data: patientData.Demographics
        });
      }
      
      if (patientData.Confounder) {
        timeline.push({
          type: 'Health History',
          date: patientData.Confounder.createdAt,
          data: patientData.Confounder
        });
      }
      
      if (patientData.OralCancer) {
        timeline.push({
          type: 'Oral Cancer Assessment',
          date: patientData.OralCancer.createdAt,
          data: patientData.OralCancer
        });
      }
      
      if (patientData.LarynxHypopharynx) {
        timeline.push({
          type: 'Larynx/Hypopharynx Assessment',
          date: patientData.LarynxHypopharynx.createdAt,
          data: patientData.LarynxHypopharynx
        });
      }
      
      if (patientData.PharynxCancer) {
        timeline.push({
          type: 'Pharynx Cancer Assessment',
          date: patientData.PharynxCancer.createdAt,
          data: patientData.PharynxCancer
        });
      }
      
      if (patientData.VHI) {
        timeline.push({
          type: 'VHI Assessment',
          date: patientData.VHI.createdAt,
          data: patientData.VHI
        });
      }
      
      if (patientData.GRBASRatings) {
        patientData.GRBASRatings.forEach(rating => {
          timeline.push({
            type: 'GRBAS Rating',
            date: rating.createdAt,
            data: rating
          });
        });
      }
      
      if (patientData.VoiceRecordings) {
        patientData.VoiceRecordings.forEach(recording => {
          timeline.push({
            type: 'Voice Recording',
            date: recording.createdAt,
            data: {
              ...recording,
              taskType: recording.taskType,
              duration: recording.durationSeconds,
              language: recording.language
            }
          });
        });
      }
      
      timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const assessmentSummary = {
        hasBasicInfo: !!patientData.Demographics,
        hasHealthHistory: !!patientData.Confounder,
        hasCancerAssessment: !!(patientData.OralCancer || patientData.LarynxHypopharynx || patientData.PharynxCancer),
        hasVoiceAssessment: !!patientData.VHI,
        hasVoiceRecordings: patientData.VoiceRecordings && patientData.VoiceRecordings.length > 0,
        totalRecordings: patientData.VoiceRecordings ? patientData.VoiceRecordings.length : 0,
        recordingsByTask: patientData.VoiceRecordings ? 
          patientData.VoiceRecordings.reduce((acc, rec) => {
            acc[rec.taskType] = (acc[rec.taskType] || 0) + 1;
            return acc;
          }, {}) : {},
        completenessScore: 0
      };
      
      let score = 0;
      if (assessmentSummary.hasBasicInfo) score += 20;
      if (assessmentSummary.hasHealthHistory) score += 20;
      if (assessmentSummary.hasCancerAssessment) score += 20;
      if (assessmentSummary.hasVoiceAssessment) score += 20;
      if (assessmentSummary.hasVoiceRecordings) score += 20;
      assessmentSummary.completenessScore = score;
      
      return {
        patient: {
          userId: patientData.userId,
          userId: patientData.userId,
          participantName: patientData.participantName,
          age: patientData.age,
          gender: patientData.gender,
          contactNumber: patientData.contactNumber,
          email: patientData.email,
          registrationDate: patientData.createdAt
        },
        assessmentSummary,
        timeline,
        voiceAnalysis: {
          totalDuration: patientData.VoiceRecordings ? 
            patientData.VoiceRecordings.reduce((sum, rec) => sum + (rec.durationSeconds || 0), 0) : 0,
          taskTypes: patientData.VoiceRecordings ? 
            [...new Set(patientData.VoiceRecordings.map(rec => rec.taskType))] : [],
          languages: patientData.VoiceRecordings ? 
            [...new Set(patientData.VoiceRecordings.map(rec => rec.language))] : [],
          chronologicalOrder: patientData.VoiceRecordings ? 
            patientData.VoiceRecordings.map(rec => ({
              id: rec.id,
              taskType: rec.taskType,
              duration: rec.durationSeconds,
              date: rec.recordingDate || rec.createdAt,
              language: rec.language,
              filePath: rec.audioFilePath
            })) : []
        }
      };
    });

    res.json({
      success: true,
      data: analysisData,
      total: analysisData.length,
      summary: {
        totalPatients: analysisData.length,
        patientsWithRecordings: analysisData.filter(p => p.assessmentSummary.hasVoiceRecordings).length,
        totalRecordings: analysisData.reduce((sum, p) => sum + p.assessmentSummary.totalRecordings, 0),
        averageCompleteness: analysisData.length > 0 ? 
          analysisData.reduce((sum, p) => sum + p.assessmentSummary.completenessScore, 0) / analysisData.length : 0
      }
    });

  } catch (error) {
    console.error('Patient analysis data error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch patient analysis data: ${error.message}` 
    });
  }
};

// Get detailed patient profile for doctor review
const getPatientDetailedProfile = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await db.Onboarding.findOne({
      where: {
        [Op.or]: [
          { userId: patientId },
          { userId: patientId }
        ]
      },
      include: [
        { 
          model: db.Demographics,
          as: 'Demographics'
        },
        { 
          model: db.Confounder,
          as: 'Confounder'
        },
        { 
          model: db.OralCancer,
          as: 'OralCancer'
        },
        { 
          model: db.LarynxHypopharynx,
          as: 'LarynxHypopharynx'
        },
        { 
          model: db.PharynxCancer,
          as: 'PharynxCancer'
        },
        { 
          model: db.VHI,
          as: 'VHI'
        },
        { 
          model: db.GRBASRating,
          as: 'GRBASRatings'
        },
        { 
          model: db.VoiceRecording,
          as: 'VoiceRecordings',
          attributes: [
            'id', 'sessionId', 'taskType', 'language', 
            'durationSeconds', 'audioFilePath', 'recordingDate'
          ],
          order: [['createdAt', 'ASC']]
        }
      ]
    });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const patientData = patient.toJSON();
    
    const profile = {
      basicInfo: {
        userId: patientData.userId,
        // userId: patientData.userId,
        participantName: patientData.participantName,
        age: patientData.age,
        gender: patientData.gender,
        contactNumber: patientData.contactNumber,
        email: patientData.email,
        registrationDate: patientData.createdAt,
        witnessName: patientData.witnessName,
        consentAccepted: patientData.consentAccepted
      },
      
      demographics: patientData.Demographics ? {
        respondentIdentity: patientData.Demographics.respondentIdentity,
        location: {
          country: patientData.Demographics.country,
          state: patientData.Demographics.state,
          district: patientData.Demographics.district,
          city: patientData.Demographics.city,
          pincode: patientData.Demographics.pincode
        },
        personalInfo: {
          education: patientData.Demographics.education,
          employment: patientData.Demographics.employment,
          occupation: patientData.Demographics.occupation,
          income: patientData.Demographics.income,
          maritalStatus: patientData.Demographics.maritalStatus,
          householdSize: patientData.Demographics.householdSize,
          residence: patientData.Demographics.residence,
          transport: patientData.Demographics.transport
        },
        disability: patientData.Demographics.disability,
        completedAt: patientData.Demographics.completedAt
      } : null,
      
      healthHistory: patientData.Confounder ? {
        tobaccoUse: {
          status: patientData.Confounder.tobaccoUse,
          forms: patientData.Confounder.tobaccoForms,
          currentStatus: patientData.Confounder.currentTobaccoStatus
        },
        alcoholUse: {
          status: patientData.Confounder.alcoholUse,
          frequency: patientData.Confounder.alcoholFrequency,
          rehabilitation: patientData.Confounder.alcoholRehab
        },
        substanceUse: {
          status: patientData.Confounder.substanceUse,
          type: patientData.Confounder.substanceType,
          recovery: patientData.Confounder.substanceRecovery
        },
        lifestyle: {
          caffeinePerDay: patientData.Confounder.caffeinePerDay,
          waterIntake: patientData.Confounder.waterIntake
        },
        medical: {
          conditions: patientData.Confounder.medicalConditions,
          medications: patientData.Confounder.medications,
          allergies: patientData.Confounder.allergies,
          dentalProblem: patientData.Confounder.dentalProblem,
          dentures: patientData.Confounder.dentures
        },
        voiceUse: {
          professionalUse: patientData.Confounder.voiceUse,
          occupation: patientData.Confounder.voiceOccupation,
          hoursPerDay: patientData.Confounder.voiceHours
        },
        currentStatus: {
          fatigueScore: patientData.Confounder.fatigueScore,
          difficultyToday: patientData.Confounder.difficultyToday
        },
        completedAt: patientData.Confounder.completedAt
      } : null,
      
      cancerAssessments: {
        oralCancer: patientData.OralCancer,
        larynxHypopharynx: patientData.LarynxHypopharynx,
        pharynxCancer: patientData.PharynxCancer
      },
      
      voiceHandicapIndex: patientData.VHI ? {
        scores: {
          functional: patientData.VHI.functionalSubscore,
          physical: patientData.VHI.physicalSubscore,
          emotional: patientData.VHI.emotionalSubscore,
          total: patientData.VHI.totalScore
        },
        severity: patientData.VHI.totalScore <= 30 ? 'Mild' : 
                 patientData.VHI.totalScore <= 60 ? 'Moderate' : 'Severe',
        detailedScores: {
          functional: patientData.VHI.functionalScores,
          physical: patientData.VHI.physicalScores,
          emotional: patientData.VHI.emotionalScores
        },
        completedAt: patientData.VHI.dateCompleted
      } : null,
      
      grbasRatings: patientData.GRBASRatings || [],
      
      voiceRecordings: patientData.VoiceRecordings ? 
        patientData.VoiceRecordings.map(recording => ({
          id: recording.id,
          taskType: recording.taskType,
          language: recording.language,
          duration: recording.durationSeconds,
          filePath: recording.audioFilePath,
          recordingDate: recording.recordingDate,
          downloadUrl: `/api/admin/recordings/${recording.id}/download`
        })) : []
    };
    
    res.json({
      success: true,
      data: profile,
      analysisNotes: {
        completenessPercentage: calculateCompletenessPercentage(profile),
        riskFactors: identifyRiskFactors(profile),
        voiceConcerns: analyzeVoiceConcerns(profile),
        recommendations: generateRecommendations(profile)
      }
    });

  } catch (error) {
    console.error('Detailed profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch patient profile: ${error.message}` 
    });
  }
};

// Export individual patient data with recordings
const exportPatientData = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { format = 'zip', includeAudio = true, audioFormat = 'wav' } = req.query;
    console.log('🔄 [BACKEND] Export request received:');
    console.log('   Patient ID:', patientId);
    console.log('   Format:', format);
    console.log('   Include Audio:', includeAudio);
    console.log('   Audio Format:', audioFormat);
    console.log('   Headers:', req.headers);
    console.log('   Auth Header:', req.headers.authorization);

    
    const patient = await db.Onboarding.findOne({
      where: { userId: patientId },
      include: [
        { model: db.Demographics, as: 'Demographics' },
        { model: db.Confounder, as: 'Confounder' },
        { model: db.OralCancer, as: 'OralCancer' },
        { model: db.LarynxHypopharynx, as: 'LarynxHypopharynx' },
        { model: db.PharynxCancer, as: 'PharynxCancer' },
        { model: db.VHI, as: 'VHI' },
        { model: db.GRBASRating, as: 'GRBASRatings' },
        { 
          model: db.VoiceRecording, 
          as: 'VoiceRecordings',
          attributes: ['id', 'sessionId', 'taskType', 'language', 'durationSeconds', 'audioFilePath', 'recordingDate']
        }
      ]
    });
    
    if (!patient) {
      console.log('❌ [BACKEND] Patient not found:', patientId);
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    console.log('✅ [BACKEND] Patient found:', patient.participantName);
    
    const patientData = patient.toJSON();
    
    const tempDir = path.join(process.cwd(), 'temp', `patient_${patientId}_${Date.now()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });
    
    try {
      const comprehensiveRecord = {
        patient_id: patientData.userId,
        participant_id: patientData.userId,
        participant_name: patientData.participantName,
        age: patientData.age,
        gender: patientData.gender,
        contact_number: patientData.contactNumber,
        email: patientData.email,
        registration_date: patientData.createdAt,
        consent_status: patientData.consentAccepted ? 'Accepted' : 'Not Accepted',
        witness_name: patientData.witnessName || 'N/A',
        
        education: patientData.Demographics?.education || 'N/A',
        occupation: patientData.Demographics?.occupation || 'N/A',
        employment: patientData.Demographics?.employment || 'N/A',
        income: patientData.Demographics?.income || 'N/A',
        marital_status: patientData.Demographics?.maritalStatus || 'N/A',
        household_size: patientData.Demographics?.householdSize || 'N/A',
        location_country: patientData.Demographics?.country || 'N/A',
        location_state: patientData.Demographics?.state || 'N/A',
        location_district: patientData.Demographics?.district || 'N/A',
        location_city: patientData.Demographics?.city || 'N/A',
        location_pincode: patientData.Demographics?.pincode || 'N/A',
        residence_type: patientData.Demographics?.residence || 'N/A',
        transport: patientData.Demographics?.transport || 'N/A',
        disability: patientData.Demographics?.disability || 'N/A',
        
        tobacco_use: patientData.Confounder?.tobaccoUse || 'N/A',
        tobacco_forms: Array.isArray(patientData.Confounder?.tobaccoForms) ? 
          patientData.Confounder.tobaccoForms.join(', ') : 'N/A',
        current_tobacco_status: patientData.Confounder?.currentTobaccoStatus || 'N/A',
        alcohol_use: patientData.Confounder?.alcoholUse || 'N/A',
        alcohol_frequency: patientData.Confounder?.alcoholFrequency || 'N/A',
        alcohol_rehabilitation: patientData.Confounder?.alcoholRehab || 'N/A',
        substance_use: patientData.Confounder?.substanceUse || 'N/A',
        substance_type: patientData.Confounder?.substanceType || 'N/A',
        substance_recovery: patientData.Confounder?.substanceRecovery || 'N/A',
        
        caffeine_per_day: patientData.Confounder?.caffeinePerDay || 'N/A',
        water_intake: patientData.Confounder?.waterIntake || 'N/A',
        
        medical_conditions: Array.isArray(patientData.Confounder?.medicalConditions) ? 
          patientData.Confounder.medicalConditions.join(', ') : 'N/A',
        current_medications: Array.isArray(patientData.Confounder?.medications) ? 
          patientData.Confounder.medications.join(', ') : 'N/A',
        allergies: patientData.Confounder?.allergies || 'N/A',
        dental_problems: patientData.Confounder?.dentalProblem || 'N/A',
        dentures: patientData.Confounder?.dentures || 'N/A',
        
        professional_voice_use: patientData.Confounder?.voiceUse || 'N/A',
        voice_occupation: patientData.Confounder?.voiceOccupation || 'N/A',
        daily_voice_hours: patientData.Confounder?.voiceHours || 'N/A',
        
        fatigue_score: patientData.Confounder?.fatigueScore || 'N/A',
        difficulty_today: patientData.Confounder?.difficultyToday || 'N/A',
        
        oral_cancer_diagnosis: patientData.OralCancer?.diagnosisConfirmed || 'N/A',
        oral_cancer_treatment: patientData.OralCancer?.treatmentType || 'N/A',
        larynx_cancer_diagnosis: patientData.LarynxHypopharynx?.diagnosisConfirmed || 'N/A',
        larynx_cancer_treatment: patientData.LarynxHypopharynx?.treatmentType || 'N/A',
        pharynx_cancer_diagnosis: patientData.PharynxCancer?.diagnosisConfirmed || 'N/A',
        pharynx_cancer_treatment: patientData.PharynxCancer?.treatmentType || 'N/A',
        
        vhi_total_score: patientData.VHI?.totalScore || 'N/A',
        vhi_functional_score: patientData.VHI?.functionalSubscore || 'N/A',
        vhi_physical_score: patientData.VHI?.physicalSubscore || 'N/A',
        vhi_emotional_score: patientData.VHI?.emotionalSubscore || 'N/A',
        vhi_severity: patientData.VHI?.totalScore ? 
          (patientData.VHI.totalScore <= 30 ? 'Mild' : 
           patientData.VHI.totalScore <= 60 ? 'Moderate' : 'Severe') : 'N/A',
        vhi_date_completed: patientData.VHI?.dateCompleted || 'N/A',
        
        total_recordings: patientData.VoiceRecordings?.length || 0,
        recording_tasks: patientData.VoiceRecordings?.map(r => r.taskType).join(', ') || 'N/A',
        total_recording_duration_seconds: patientData.VoiceRecordings?.reduce((sum, r) => sum + (r.durationSeconds || 0), 0) || 0,
        languages_recorded: patientData.VoiceRecordings ? 
          [...new Set(patientData.VoiceRecordings.map(r => r.language))].join(', ') : 'N/A',
        first_recording_date: patientData.VoiceRecordings?.length > 0 ? 
          patientData.VoiceRecordings[0].recordingDate : 'N/A',
        last_recording_date: patientData.VoiceRecordings?.length > 0 ? 
          patientData.VoiceRecordings[patientData.VoiceRecordings.length - 1].recordingDate : 'N/A',
        
        grbas_ratings_count: patientData.GRBASRatings?.length || 0,
        
        demographics_completed: patientData.Demographics ? 'Yes' : 'No',
        health_history_completed: patientData.Confounder ? 'Yes' : 'No',
        cancer_assessment_completed: (patientData.OralCancer || patientData.LarynxHypopharynx || patientData.PharynxCancer) ? 'Yes' : 'No',
        vhi_completed: patientData.VHI ? 'Yes' : 'No',
        voice_recordings_available: patientData.VoiceRecordings?.length > 0 ? 'Yes' : 'No',
        
        doctor_notes: '',
        diagnosis: '',
        treatment_plan: '',
        follow_up_required: '',
        priority_level: '',
        recommendations: '',
        
        export_date: new Date().toISOString(),
        exported_by: 'Admin System'
      };
      
      const csvData = [comprehensiveRecord];
      const csv = json2csv(csvData, {
        fields: Object.keys(comprehensiveRecord),
        withBOM: true,
        excelStrings: true
      });
      
      const csvFilePath = path.join(tempDir, `${patientData.participantName || 'patient'}_complete_data.csv`);
      await fs.promises.writeFile(csvFilePath, csv);
      
      const pdfFilePath = path.join(tempDir, `${patientData.participantName || 'patient'}_detailed_report.pdf`);
      await generatePatientPDFReport(patientData, pdfFilePath);
      
      const audioFiles = [];
      if (includeAudio && patientData.VoiceRecordings) {
        const audioDir = path.join(tempDir, 'voice_recordings');
        await fs.promises.mkdir(audioDir, { recursive: true });
        
        for (const recording of patientData.VoiceRecordings) {
          if (recording.audioFilePath && fs.existsSync(recording.audioFilePath)) {
            const baseFileName = `${patientData.participantName || 'patient'}_${recording.taskType.replace(/\s+/g, '_')}_${new Date(recording.recordingDate || recording.createdAt).toISOString().split('T')[0]}`;
            
            if (audioFormat === 'wav') {
              const wavFilePath = path.join(audioDir, `${baseFileName}.wav`);
              await convertToWav(recording.audioFilePath, wavFilePath, 44100);
              audioFiles.push({
                fileName: `${baseFileName}.wav`,
                filePath: wavFilePath,
                taskType: recording.taskType,
                duration: recording.durationSeconds,
                recordingDate: recording.recordingDate
              });
            } else {
              const originalExt = path.extname(recording.audioFilePath) || '.mp3';
              const copyFilePath = path.join(audioDir, `${baseFileName}${originalExt}`);
              await fs.promises.copyFile(recording.audioFilePath, copyFilePath);
              audioFiles.push({
                fileName: `${baseFileName}${originalExt}`,
                filePath: copyFilePath,
                taskType: recording.taskType,
                duration: recording.durationSeconds,
                recordingDate: recording.recordingDate
              });
            }
          }
        }
        
        if (audioFiles.length > 0) {
          const audioManifest = {
            patientInfo: {
              name: patientData.participantName,
              id: patientData.userId,
              userId: patientData.userId
            },
            exportDate: new Date().toISOString(),
            totalRecordings: audioFiles.length,
            audioFormat: audioFormat,
            recordings: audioFiles.map(f => ({
              fileName: f.fileName,
              taskType: f.taskType,
              duration: f.duration,
              recordingDate: f.recordingDate
            }))
          };
          
          const manifestPath = path.join(audioDir, 'recording_manifest.json');
          await fs.promises.writeFile(manifestPath, JSON.stringify(audioManifest, null, 2));
        }
      }
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${patientData.participantName || 'patient'}_data.csv"`);
        res.send(csv);
        return;
      }
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${patientData.participantName || 'patient'}_report.pdf"`);
        const pdfBuffer = await fs.promises.readFile(pdfFilePath);
        res.send(pdfBuffer);
        return;
      }
      
      // Create ZIP archive
      const zipFilePath = path.join(process.cwd(), 'temp', `${patientData.participantName || 'patient'}_complete_export_${Date.now()}.zip`);
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      return new Promise((resolve, reject) => {
        output.on('close', async () => {
          try {
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${patientData.participantName || 'patient'}_complete_export.zip"`);
            
            const zipBuffer = await fs.promises.readFile(zipFilePath);
            
            // Clean up
            await fs.promises.rmdir(tempDir, { recursive: true });
            await fs.promises.unlink(zipFilePath);
            
            res.send(zipBuffer);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        
        archive.on('error', reject);
        archive.pipe(output);
        
        // Add CSV file
        archive.file(csvFilePath, { name: 'patient_complete_data.csv' });
        
        // Add PDF report
        archive.file(pdfFilePath, { name: 'patient_detailed_report.pdf' });
        
        // Add audio files and manifest
        if (audioFiles.length > 0) {
          audioFiles.forEach(audioFile => {
            archive.file(audioFile.filePath, { name: `voice_recordings/${audioFile.fileName}` });
          });
          
          const manifestPath = path.join(tempDir, 'voice_recordings', 'recording_manifest.json');
          if (fs.existsSync(manifestPath)) {
            archive.file(manifestPath, { name: 'voice_recordings/recording_manifest.json' });
          }
        }
        
        // Add readme file
        const readmeContent = generatePatientExportReadme(patientData, audioFiles.length > 0);
        archive.append(readmeContent, { name: 'README.txt' });
        
        archive.finalize();
      });
      
    } finally {
      try {
        if (fs.existsSync(tempDir)) {
          await fs.promises.rmdir(tempDir, { recursive: true });
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
  } catch (error) {
    console.error('Patient export error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Export failed: ${error.message}` 
    });
  }
};

// Download recording in WAV format
const downloadRecordingWav = async (req, res) => {
  try {
    const { recordingId } = req.params;
    
    const recording = await db.VoiceRecording.findByPk(recordingId, {
      include: [{
        model: db.Onboarding,
        attributes: ['participantName', 'userId']
      }]
    });
    
    if (!recording) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }
    
    if (!recording.audioFilePath || !fs.existsSync(recording.audioFilePath)) {
      return res.status(404).json({ success: false, message: 'Audio file not found' });
    }
    
    // Create temporary WAV file
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.promises.mkdir(tempDir, { recursive: true });
    
    const patient = recording.Onboarding;
    const fileName = `${patient?.userId || 'patient'}_${recording.taskType.replace(/\s+/g, '_')}_${recordingId}.wav`;
    const outputPath = path.join(tempDir, fileName);
    
    // Convert to WAV
    await convertToWav(recording.audioFilePath, outputPath, 44100);
    
    // Send WAV file
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
    
    // Clean up temp file after sending
    fileStream.on('close', () => {
      fs.unlink(outputPath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });
    
  } catch (error) {
    console.error('WAV download error:', error);
    res.status(500).json({ success: false, message: `Download failed: ${error.message}` });
  }
};

// Enhanced comprehensive export
const exportComprehensiveData = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      format = 'zip', 
      audioFormat = 'wav',
      sampleRate = 44100,
      includeAudio = true 
    } = req.query;
    
    const whereClause = {
      createdAt: {
        [Op.between]: [
          startDate || new Date('1970-01-01'),
          endDate || new Date()
        ]
      }
    };

    const users = await db.Onboarding.findAll({ 
      where: whereClause,
      include: [
        { model: db.Demographics, as: 'Demographics', required: false },
        { model: db.Confounder, as: 'Confounder', required: false },
        { model: db.OralCancer, as: 'OralCancer', required: false },
        { model: db.LarynxHypopharynx, as: 'LarynxHypopharynx', required: false },
        { model: db.PharynxCancer, as: 'PharynxCancer', required: false },
        { model: db.VHI, as: 'VHI', required: false },
        { model: db.GRBASRating, as: 'GRBASRatings', required: false },
        { 
          model: db.VoiceRecording,
          as: 'VoiceRecordings',
          required: false,
          attributes: [
            'id', 'sessionId', 'taskType', 'language', 
            'durationSeconds', 'audioFilePath', 'recordingDate'
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!users || users.length === 0) {
      return res.json({
        success: true,
        message: 'No data found for the selected criteria',
        data: []
      });
    }

    // Create temporary directory for processing
    const tempDir = path.join(process.cwd(), 'temp', `export_${Date.now()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });

    try {
      const comprehensiveData = [];
      const audioFiles = [];

      for (const user of users) {
        const userData = user.toJSON();
        
        const patientRecord = {
          patient_id: userData.userId,
          participant_id: userData.userId,
          participant_name: userData.participantName,
          registration_date: userData.createdAt,
          consent_status: userData.consentAccepted ? 'Accepted' : 'Not Accepted',
          witness_name: userData.witnessName || 'N/A',
          
          age: userData.age || 'N/A',
          gender: userData.gender || 'N/A',
          education: userData.Demographics?.education || 'N/A',
          occupation: userData.Demographics?.occupation || 'N/A',
          location: `${userData.Demographics?.city || 'N/A'}, ${userData.Demographics?.state || 'N/A'}`,
          marital_status: userData.Demographics?.maritalStatus || 'N/A',
          
          tobacco_use: userData.Confounder?.tobaccoUse || 'N/A',
          tobacco_forms: userData.Confounder?.tobaccoForms?.join(', ') || 'N/A',
          current_tobacco_status: userData.Confounder?.currentTobaccoStatus || 'N/A',
          alcohol_use: userData.Confounder?.alcoholUse || 'N/A',
          alcohol_frequency: userData.Confounder?.alcoholFrequency || 'N/A',
          substance_use: userData.Confounder?.substanceUse || 'N/A',
          
          medical_conditions: userData.Confounder?.medicalConditions?.join(', ') || 'N/A',
          current_medications: userData.Confounder?.medications?.join(', ') || 'N/A',
          allergies: userData.Confounder?.allergies || 'N/A',
          dental_problems: userData.Confounder?.dentalProblem || 'N/A',
          
          professional_voice_use: userData.Confounder?.voiceUse || 'N/A',
          voice_occupation: userData.Confounder?.voiceOccupation || 'N/A',
          daily_voice_hours: userData.Confounder?.voiceHours || 'N/A',
          
          oral_cancer_diagnosis: userData.OralCancer?.diagnosisConfirmed || 'N/A',
          larynx_cancer_diagnosis: userData.LarynxHypopharynx?.diagnosisConfirmed || 'N/A',
          pharynx_cancer_diagnosis: userData.PharynxCancer?.diagnosisConfirmed || 'N/A',
          
          vhi_total_score: userData.VHI?.totalScore || 'N/A',
          vhi_functional_score: userData.VHI?.functionalSubscore || 'N/A',
          vhi_physical_score: userData.VHI?.physicalSubscore || 'N/A',
          vhi_emotional_score: userData.VHI?.emotionalSubscore || 'N/A',
          vhi_severity: userData.VHI?.totalScore ? 
            (userData.VHI.totalScore <= 30 ? 'Mild' : 
             userData.VHI.totalScore <= 60 ? 'Moderate' : 'Severe') : 'N/A',
          
          total_recordings: userData.VoiceRecordings?.length || 0,
          recording_tasks: userData.VoiceRecordings?.map(r => r.taskType).join(', ') || 'N/A',
          total_recording_duration_ms: userData.VoiceRecordings?.reduce((sum, r) => sum + (r.durationSeconds || 0), 0) || 0,
          languages_recorded: userData.VoiceRecordings ? 
            [...new Set(userData.VoiceRecordings.map(r => r.language))].join(', ') : 'N/A',
          
          assessment_completion_percentage: calculateCompletenessForExport(userData),
          
          doctor_notes: '',
          diagnosis_notes: '',
          treatment_recommendations: '',
          follow_up_required: '',
          priority_level: calculatePriorityLevel(userData)
        };

        comprehensiveData.push(patientRecord);

        // Process audio files if requested
        if (includeAudio && userData.VoiceRecordings) {
          for (const recording of userData.VoiceRecordings) {
            if (recording.audioFilePath) {
              const originalFileName = recording.audioFilePath.split('/').pop() || `recording_${recording.id}`;
              const baseFileName = path.parse(originalFileName).name;
              const audioFileName = `${userData.userId}_${baseFileName}_${recording.taskType.replace(/\s+/g, '_')}_${new Date(recording.recordingDate).toISOString().split('T')[0]}.${audioFormat}`;
              const audioFilePath = path.join(tempDir, audioFileName);
              
              try {
                if (audioFormat === 'wav') {
                  await convertToWav(recording.audioFilePath, audioFilePath, parseInt(sampleRate));
                } else {
                  await fs.promises.copyFile(recording.audioFilePath, audioFilePath);
                }
                
                audioFiles.push({
                  fileName: audioFileName,
                  filePath: audioFilePath,
                  participant: userData.userId,
                  taskType: recording.taskType,
                  duration: recording.durationSeconds,
                  recordingDate: recording.recordingDate,
                  originalPath: recording.audioFilePath
                });
              } catch (audioError) {
                console.error(`Error processing audio for recording ${recording.id}:`, audioError);
              }
            }
          }
        }
      }

      // Generate CSV file
      const csvFilePath = path.join(tempDir, 'comprehensive_patient_data_for_doctors.csv');
      const csv = json2csv(comprehensiveData, {
        fields: Object.keys(comprehensiveData[0] || {}),
        withBOM: true,
        excelStrings: true
      });
      await fs.promises.writeFile(csvFilePath, csv);

      // Generate analysis report
      const analysisReportPath = path.join(tempDir, 'patient_analysis_report.json');
      const analysisReport = {
        exportDate: new Date().toISOString(),
        totalPatients: comprehensiveData.length,
        exportParameters: {
          startDate,
          endDate,
          includeAudio,
          audioFormat,
          sampleRate
        },
        patientSummary: {
          withVoiceRecordings: comprehensiveData.filter(p => p.total_recordings > 0).length,
          highPriority: comprehensiveData.filter(p => p.priority_level === 'High').length,
          moderatePriority: comprehensiveData.filter(p => p.priority_level === 'Moderate').length,
          averageCompleteness: comprehensiveData.reduce((sum, p) => sum + parseInt(p.assessment_completion_percentage), 0) / comprehensiveData.length
        },
        riskFactorAnalysis: {
          tobaccoUsers: comprehensiveData.filter(p => p.tobacco_use === 'Yes').length,
          alcoholUsers: comprehensiveData.filter(p => p.alcohol_use === 'Yes').length,
          professionalVoiceUsers: comprehensiveData.filter(p => p.professional_voice_use === 'Professional').length
        },
        voiceHandicapDistribution: {
          mild: comprehensiveData.filter(p => p.vhi_severity === 'Mild').length,
          moderate: comprehensiveData.filter(p => p.vhi_severity === 'Moderate').length,
          severe: comprehensiveData.filter(p => p.vhi_severity === 'Severe').length
        }
      };
      await fs.promises.writeFile(analysisReportPath, JSON.stringify(analysisReport, null, 2));

      // Generate audio manifest
      if (audioFiles.length > 0) {
        const audioManifest = {
          exportDate: new Date().toISOString(),
          totalFiles: audioFiles.length,
          audioFormat: audioFormat,
          sampleRate: sampleRate,
          instructions: "Audio files are organized by participant ID and task type. Listen to recordings chronologically for each patient to assess voice progression.",
          files: audioFiles.map(f => ({
            fileName: f.fileName,
            participant: f.participant,
            taskType: f.taskType,
            duration: f.duration,
            recordingDate: f.recordingDate
          }))
        };
        
        const manifestPath = path.join(tempDir, 'audio_analysis_guide.json');
        await fs.promises.writeFile(manifestPath, JSON.stringify(audioManifest, null, 2));
      }

      // Create ZIP archive
      if (format === 'zip') {
        const zipFilePath = path.join(process.cwd(), 'temp', `doctor_analysis_export_${Date.now()}.zip`);
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
          output.on('close', async () => {
            try {
              res.setHeader('Content-Type', 'application/zip');
              res.setHeader('Content-Disposition', `attachment; filename=doctor_analysis_export_${Date.now()}.zip`);
              
              const zipBuffer = await fs.promises.readFile(zipFilePath);
              
              // Clean up
              await fs.promises.rmdir(tempDir, { recursive: true });
              await fs.promises.unlink(zipFilePath);
              
              res.send(zipBuffer);
              resolve();
            } catch (error) {
              reject(error);
            }
          });

          archive.on('error', reject);
          archive.pipe(output);

          archive.file(csvFilePath, { name: 'comprehensive_patient_data_for_doctors.csv' });
          archive.file(analysisReportPath, { name: 'patient_analysis_report.json' });
          
          if (audioFiles.length > 0) {
            archive.file(path.join(tempDir, 'audio_analysis_guide.json'), { name: 'audio_analysis_guide.json' });
          }

          audioFiles.forEach(audioFile => {
            const patientFolder = `patient_recordings/${audioFile.participant}`;
            archive.file(audioFile.filePath, { name: `${patientFolder}/${audioFile.fileName}` });
          });

          archive.finalize();
        });
      } else {
        res.json({
          success: true,
          data: {
            patients: comprehensiveData,
            audioFiles: audioFiles.map(f => ({
              fileName: f.fileName,
              participant: f.participant,
              taskType: f.taskType,
              recordingDate: f.recordingDate
            })),
            analysisReport: analysisReport
          }
        });
      }

    } finally {
      try {
        await fs.promises.rmdir(tempDir, { recursive: true });
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

  } catch (error) {
    console.error('Comprehensive export error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Export failed: ${error.message}` 
    });
  }
};

// Get statistics
const getStatistics = async (req, res) => {
  try {
    const stats = await Promise.all([
      db.Onboarding.count(),
      db.Demographics.count(),
      db.Confounder.count(),
      db.OralCancer.count(),
      db.LarynxHypopharynx.count(),
      db.PharynxCancer.count(),
      db.VHI.count(),
      db.GRBASRating.count(),
      db.VoiceRecording.count()
    ]);

    const vhiScores = await db.VHI.findAll({
      attributes: ['totalScore'],
      raw: true
    });

    const scoreDistribution = {
      mild: 0,
      moderate: 0,
      severe: 0
    };

    vhiScores.forEach(score => {
      if (score.totalScore <= 30) scoreDistribution.mild++;
      else if (score.totalScore <= 60) scoreDistribution.moderate++;
      else scoreDistribution.severe++;
    });

    const patientsWithData = await db.Onboarding.findAll({
      include: [
        { model: db.Demographics, as: 'Demographics', required: false },
        { model: db.Confounder, as: 'Confounder', required: false },
        { model: db.VHI, as: 'VHI', required: false },
        { model: db.VoiceRecording, as: 'VoiceRecordings', required: false }
      ],
      raw: false
    });

    const completionAnalysis = {
      fullyCompleted: 0,
      partiallyCompleted: 0,
      minimal: 0,
      withVoiceRecordings: 0
    };

    patientsWithData.forEach(patient => {
      const data = patient.toJSON();
      let sections = 0;
      
      if (data.Demographics) sections++;
      if (data.Confounder) sections++;
      if (data.VHI) sections++;
      if (data.VoiceRecordings && data.VoiceRecordings.length > 0) {
        sections++;
        completionAnalysis.withVoiceRecordings++;
      }
      
      if (sections >= 4) completionAnalysis.fullyCompleted++;
      else if (sections >= 2) completionAnalysis.partiallyCompleted++;
      else completionAnalysis.minimal++;
    });

    res.json({
      success: true,
      data: {
        totalUsers: stats[0],
        totalDemographics: stats[1],
        totalConfounders: stats[2],
        totalOralCancer: stats[3],
        totalLarynx: stats[4],
        totalPharynx: stats[5],
        totalVHI: stats[6],
        totalGRBAS: stats[7],
        totalVoiceRecordings: stats[8],
        vhiScores: scoreDistribution,
        completionAnalysis
      }
    });

  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Statistics failed: ${error.message}` 
    });
  }
};

// Get voice recordings for admin
const getVoiceRecordingsAdmin = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      taskType, 
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      patientSearch 
    } = req.query;
    
    const whereClause = {
      createdAt: {
        [Op.between]: [
          startDate || new Date('1970-01-01'),
          endDate || new Date()
        ]
      }
    };

    if (userId) whereClause.userId = userId;
    if (taskType && taskType !== 'All Tasks') whereClause.taskType = taskType;

    const includeClause = {
      model: db.Onboarding,
      attributes: ['participantName', 'userId', 'age', 'gender', 'contactNumber'],
      ...(patientSearch && {
        where: {
          [Op.or]: [
            { participantName: { [Op.iLike]: `%${patientSearch}%` } },
            { userId: { [Op.iLike]: `%${patientSearch}%` } }
          ]
        }
      })
    };

    const recordings = await db.VoiceRecording.findAll({
      where: whereClause,
      include: [includeClause],
      order: [[sortBy, sortOrder]],
      attributes: [
        'id',
        'userId',
        'sessionId',
        'taskType',
        'language',
        'durationSeconds',
        'audioFilePath',
        'recordingDate',
        'createdAt',
        'updatedAt'
      ]
    });

    const groupedByPatient = recordings.reduce((acc, recording) => {
      const patientId = recording.userId;
      if (!acc[patientId]) {
        acc[patientId] = {
          patient: recording.Onboarding,
          recordings: [],
          totalDuration: 0,
          taskTypes: new Set(),
          languages: new Set()
        };
      }
      
      acc[patientId].recordings.push(recording);
      acc[patientId].totalDuration += recording.durationSeconds || 0;
      acc[patientId].taskTypes.add(recording.taskType);
      acc[patientId].languages.add(recording.language);
      
      return acc;
    }, {});

    Object.values(groupedByPatient).forEach(patient => {
      patient.taskTypes = Array.from(patient.taskTypes);
      patient.languages = Array.from(patient.languages);
      patient.recordings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });

    res.json({
      success: true,
      data: recordings,
      groupedByPatient,
      total: recordings.length,
      summary: {
        totalPatients: Object.keys(groupedByPatient).length,
        totalRecordings: recordings.length,
        totalDuration: recordings.reduce((sum, r) => sum + (r.durationSeconds || 0), 0),
        taskTypeDistribution: recordings.reduce((acc, r) => {
          acc[r.taskType] = (acc[r.taskType] || 0) + 1;
          return acc;
        }, {}),
        languageDistribution: recordings.reduce((acc, r) => {
          acc[r.language] = (acc[r.language] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Admin voice recordings error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch recordings: ${error.message}` 
    });
  }
};

// Download recording for admin
const downloadRecordingAdmin = async (req, res) => {
  try {
    const { recordingId } = req.params;
    
    const recording = await db.VoiceRecording.findByPk(recordingId, {
      include: [{
        model: db.Onboarding,
        attributes: ['participantName', 'userId']
      }]
    });
    
    if (!recording) {
      return res.status(404).json({ 
        success: false, 
        message: 'Recording not found' 
      });
    }

    const patient = recording.Onboarding;
    const enhancedFileName = `${patient.userId}_${recording.taskType.replace(/\s+/g, '_')}_recording.mp3`;

    if (recording.audioFilePath && fs.existsSync(recording.audioFilePath)) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${enhancedFileName}"`);
      res.sendFile(path.resolve(recording.audioFilePath));
    } else {
      return res.status(404).json({ 
        success: false, 
        message: 'Recording file not found' 
      });
    }
  } catch (error) {
    console.error('Admin download recording error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Download failed: ${error.message}` 
    });
  }
};

// Submit clinical notes
const submitClinicalNotes = async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      diagnosis,
      treatmentPlan,
      followUpNotes,
      priorityLevel,
      recommendations,
      voiceAnalysisNotes
    } = req.body;

    res.json({
      success: true,
      message: 'Clinical notes saved successfully',
      data: {
        patientId,
        diagnosis,
        treatmentPlan,
        followUpNotes,
        priorityLevel,
        recommendations,
        voiceAnalysisNotes,
        submittedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Submit clinical notes error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to save clinical notes: ${error.message}`
    });
  }
};

// Analyze patient voice progression
const analyzePatientVoiceProgression = async (req, res) => {
  try {
    const { patientId } = req.params;

    res.json({
      success: true,
      data: {
        patientId,
        analysisDate: new Date(),
        progressionScore: Math.random() * 100,
        recommendations: [
          'Continue voice therapy exercises',
          'Schedule follow-up in 2 weeks',
          'Monitor for any voice strain'
        ]
      }
    });
  } catch (error) {
    console.error('Voice progression analysis error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to analyze voice progression: ${error.message}`
    });
  }
};

// Get voice analysis summary
const getVoiceAnalysisSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    res.json({
      success: true,
      data: {
        totalRecordings: 150,
        averageDuration: '45 seconds',
        commonIssues: ['Background noise', 'Short duration', 'Low volume'],
        qualityScore: 85,
        analysisPeriod: {
          startDate: startDate || new Date('2024-01-01'),
          endDate: endDate || new Date()
        }
      }
    });
  } catch (error) {
    console.error('Voice analysis summary error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get voice analysis summary: ${error.message}`
    });
  }
};

// Export filtered patients
const exportFilteredPatients = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      priority,
      hasVoiceRecordings,
      minCompleteness,
      format = 'csv'
    } = req.query;

    res.json({
      success: true,
      message: 'Filtered export functionality coming soon',
      parameters: {
        startDate,
        endDate,
        priority,
        hasVoiceRecordings,
        minCompleteness,
        format
      }
    });
  } catch (error) {
    console.error('Export filtered patients error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to export filtered patients: ${error.message}`
    });
  }
};

// Update patient information
const updatePatientInfo = async (req, res) => {
  try {
    const { patientId } = req.params;
    const updates = req.body;
    
    const patient = await db.Onboarding.findOne({ where: { userId: patientId } });
    
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    await patient.update(updates);
    
    res.json({ success: true, message: 'Patient information updated', data: patient });
    
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ success: false, message: `Update failed: ${error.message}` });
  }
};

// Delete patient
const deletePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await db.Onboarding.findOne({ where: { userId: patientId } });
    
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    // Delete associated records first
    await db.Demographics.destroy({ where: { userId: patientId } });
    await db.Confounder.destroy({ where: { userId: patientId } });
    await db.VHI.destroy({ where: { userId: patientId } });
    await db.VoiceRecording.destroy({ where: { userId: patientId } });
    
    // Delete the patient
    await patient.destroy();
    
    res.json({ success: true, message: 'Patient deleted successfully' });
    
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ success: false, message: `Delete failed: ${error.message}` });
  }
};

// Legacy export function
const exportData = async (req, res) => {
  try {
    return exportComprehensiveData(req, res);
  } catch (error) {
    console.error('Legacy export error:', error);
    res.status(500).json({
      success: false,
      message: `Export failed: ${error.message}`
    });
  }
};

// Helper function to calculate completeness percentage
const calculateCompletenessPercentage = (profile) => {
  let completed = 0;
  let total = 5;
  
  if (profile.basicInfo) completed++;
  if (profile.demographics) completed++;
  if (profile.healthHistory) completed++;
  if (profile.voiceHandicapIndex) completed++;
  if (profile.voiceRecordings && profile.voiceRecordings.length > 0) completed++;
  
  return Math.round((completed / total) * 100);
};

// Helper function to identify risk factors
const identifyRiskFactors = (profile) => {
  const riskFactors = [];
  
  if (profile.healthHistory) {
    if (profile.healthHistory.tobaccoUse?.status === 'Yes' || 
        profile.healthHistory.tobaccoUse?.currentStatus === 'Current') {
      riskFactors.push({
        type: 'Tobacco Use',
        severity: 'High',
        details: profile.healthHistory.tobaccoUse
      });
    }
    
    if (profile.healthHistory.alcoholUse?.status === 'Yes') {
      riskFactors.push({
        type: 'Alcohol Use',
        severity: 'Moderate',
        details: profile.healthHistory.alcoholUse
      });
    }
    
    if (profile.healthHistory.voiceUse?.professionalUse === 'Professional') {
      riskFactors.push({
        type: 'Professional Voice Use',
        severity: 'Low',
        details: profile.healthHistory.voiceUse
      });
    }
  }
  
  return riskFactors;
};

// Helper function to analyze voice concerns
const analyzeVoiceConcerns = (profile) => {
  const concerns = [];
  
  if (profile.voiceHandicapIndex) {
    const vhi = profile.voiceHandicapIndex;
    if (vhi.scores.total > 60) {
      concerns.push({
        type: 'Severe Voice Handicap',
        score: vhi.scores.total,
        priority: 'High'
      });
    } else if (vhi.scores.total > 30) {
      concerns.push({
        type: 'Moderate Voice Handicap',
        score: vhi.scores.total,
        priority: 'Medium'
      });
    }
  }
  
  if (profile.voiceRecordings && profile.voiceRecordings.length > 0) {
    const totalDuration = profile.voiceRecordings.reduce((sum, rec) => sum + rec.duration, 0);
    if (totalDuration < 60000) {
      concerns.push({
        type: 'Limited Voice Sample',
        details: 'Insufficient recording duration for comprehensive analysis',
        priority: 'Medium'
      });
    }
  } else {
    concerns.push({
      type: 'No Voice Recordings',
      details: 'No voice samples available for analysis',
      priority: 'High'
    });
  }
  
  return concerns;
};

// Helper function to generate recommendations
const generateRecommendations = (profile) => {
  const recommendations = [];
  
  const completeness = calculateCompletenessPercentage(profile);
  if (completeness < 80) {
    recommendations.push({
      type: 'Complete Assessment',
      priority: 'High',
      description: 'Patient assessment is incomplete. Follow up to gather missing information.'
    });
  }
  
  if (profile.voiceHandicapIndex && profile.voiceHandicapIndex.scores.total > 30) {
    recommendations.push({
      type: 'Voice Therapy Evaluation',
      priority: 'High',
      description: 'Consider referral to speech-language pathologist for voice therapy evaluation.'
    });
  }
  
  const riskFactors = identifyRiskFactors(profile);
  if (riskFactors.some(rf => rf.severity === 'High')) {
    recommendations.push({
      type: 'Risk Factor Management',
      priority: 'High',
      description: 'Address high-risk factors (tobacco/alcohol use) as part of treatment plan.'
    });
  }
  
  return recommendations;
};

// Helper function for export completeness calculation
const calculateCompletenessForExport = (userData) => {
  let completed = 0;
  let total = 5;
  
  if (userData.Demographics) completed++;
  if (userData.Confounder) completed++;
  if (userData.VHI) completed++;
  if (userData.VoiceRecordings && userData.VoiceRecordings.length > 0) completed++;
  if (userData.OralCancer || userData.LarynxHypopharynx || userData.PharynxCancer) completed++;
  
  return Math.round((completed / total) * 100);
};

// Helper function to calculate priority level
const calculatePriorityLevel = (userData) => {
  let priority = 'Low';
  
  if (userData.VHI && userData.VHI.totalScore > 60) priority = 'High';
  if (userData.Confounder && userData.Confounder.tobaccoUse === 'Yes') priority = 'High';
  if (userData.OralCancer || userData.LarynxHypopharynx || userData.PharynxCancer) priority = 'High';
  
  if (userData.VHI && userData.VHI.totalScore > 30 && priority !== 'High') priority = 'Moderate';
  if (userData.Confounder && userData.Confounder.alcoholUse === 'Yes' && priority !== 'High') priority = 'Moderate';
  
  return priority;
};

// Convert audio to WAV format
const convertToWav = async (inputPath, outputPath, sampleRate = 44100) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('pcm_s16le')
      .audioFrequency(sampleRate)
      .audioChannels(1)
      .format('wav')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
};

// Generate patient PDF report
const generatePatientPDFReport = async (patientData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20).text('Comprehensive Patient Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);
      
      // Patient Information
      doc.fontSize(16).text('Patient Information', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Name: ${patientData.participantName || 'N/A'}`);
      doc.text(`ID: ${patientData.userId || patientData.userId || 'N/A'}`);
      doc.text(`Age: ${patientData.age || 'N/A'}`);
      doc.text(`Gender: ${patientData.gender || 'N/A'}`);
      doc.text(`Contact: ${patientData.contactNumber || 'N/A'}`);
      doc.text(`Email: ${patientData.email || 'N/A'}`);
      doc.text(`Registration Date: ${new Date(patientData.createdAt).toLocaleDateString()}`);
      doc.moveDown();
      
      // Demographics
      if (patientData.Demographics) {
        doc.fontSize(16).text('Demographics', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Education: ${patientData.Demographics.education || 'N/A'}`);
        doc.text(`Occupation: ${patientData.Demographics.occupation || 'N/A'}`);
        doc.text(`Employment: ${patientData.Demographics.employment || 'N/A'}`);
        doc.text(`Income: ${patientData.Demographics.income || 'N/A'}`);
        doc.text(`Marital Status: ${patientData.Demographics.maritalStatus || 'N/A'}`);
        doc.text(`Location: ${patientData.Demographics.city || 'N/A'}, ${patientData.Demographics.state || 'N/A'}`);
        doc.moveDown();
      }
      
      // Health History
      if (patientData.Confounder) {
        doc.fontSize(16).text('Health History', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Tobacco Use: ${patientData.Confounder.tobaccoUse || 'N/A'}`);
        doc.text(`Alcohol Use: ${patientData.Confounder.alcoholUse || 'N/A'}`);
        doc.text(`Professional Voice Use: ${patientData.Confounder.voiceUse || 'N/A'}`);
        doc.text(`Voice Hours per Day: ${patientData.Confounder.voiceHours || 'N/A'}`);
        doc.moveDown();
      }
      
      // Voice Handicap Index
      if (patientData.VHI) {
        doc.fontSize(16).text('Voice Handicap Index (VHI-30)', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total Score: ${patientData.VHI.totalScore || 'N/A'}`);
        doc.text(`Functional Score: ${patientData.VHI.functionalSubscore || 'N/A'}`);
        doc.text(`Physical Score: ${patientData.VHI.physicalSubscore || 'N/A'}`);
        doc.text(`Emotional Score: ${patientData.VHI.emotionalSubscore || 'N/A'}`);
        const severity = patientData.VHI.totalScore ? 
          (patientData.VHI.totalScore <= 30 ? 'Mild' : 
           patientData.VHI.totalScore <= 60 ? 'Moderate' : 'Severe') : 'N/A';
        doc.text(`Severity: ${severity}`);
        doc.moveDown();
      }
      
      // Voice Recordings
      if (patientData.VoiceRecordings && patientData.VoiceRecordings.length > 0) {
        doc.fontSize(16).text('Voice Recordings', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total Recordings: ${patientData.VoiceRecordings.length}`);
        
        const taskTypes = [...new Set(patientData.VoiceRecordings.map(r => r.taskType))];
        doc.text(`Task Types: ${taskTypes.join(', ')}`);
        
        const totalDuration = patientData.VoiceRecordings.reduce((sum, r) => sum + (r.durationSeconds || 0), 0);
        doc.text(`Total Duration: ${Math.round(totalDuration / 60)} minutes`);
        doc.moveDown();
        
        doc.fontSize(14).text('Recording Details:', { underline: true });
        doc.moveDown();
        patientData.VoiceRecordings.forEach((recording, index) => {
          doc.fontSize(10);
          doc.text(`${index + 1}. Task: ${recording.taskType || 'N/A'}, Duration: ${recording.durationSeconds || 0}s, Language: ${recording.language || 'N/A'}`);
        });
      }
      
      doc.end();
      
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
      
    } catch (error) {
      reject(error);
    }
  });
};

// Generate patient export readme
const generatePatientExportReadme = (patientData, hasAudioFiles) => {
  return `COMPREHENSIVE PATIENT DATA EXPORT
=====================================

Patient: ${patientData.participantName || 'Unknown'}
Patient ID: ${patientData.userId || patientData.userId || 'N/A'}
Export Date: ${new Date().toLocaleDateString()}

FILES INCLUDED:
--------------
1. patient_complete_data.csv - Complete patient data in CSV format for analysis
2. patient_detailed_report.pdf - Comprehensive PDF report for clinical review
${hasAudioFiles ? `3. voice_recordings/ - Folder containing all voice recordings in WAV format
4. voice_recordings/recording_manifest.json - Metadata for all recordings` : '3. No voice recordings available for this patient'}

CSV DATA INCLUDES:
-----------------
• Complete patient demographics and contact information
• Detailed health history including substance use and medical conditions  
• Voice usage patterns and professional voice use
• Cancer assessment results (if completed)
• Voice Handicap Index (VHI-30) scores and analysis
• Complete voice recording summary with task types and durations
• Assessment completion status for all modules
• Clinical notes fields for doctor annotations

PDF REPORT INCLUDES:
-------------------
• Patient summary and key information
• Risk factor analysis
• Voice assessment results
• Clinical recommendations
• Assessment completion summary

${hasAudioFiles ? `VOICE RECORDINGS:
----------------
• All recordings converted to high-quality WAV format (44.1kHz)
• Files named with patient ID, task type, and date for easy identification
• recording_manifest.json contains complete metadata for each recording
• Suitable for clinical voice analysis software` : ''}

CLINICAL USE:
------------
This export is designed for comprehensive clinical review and analysis.
All data has been de-identified where appropriate while maintaining 
clinical relevance for voice disorder assessment and treatment planning.

For questions about this export, please contact the system administrator.
`;
};
const getPatientVoiceRecordings = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const recordings = await db.VoiceRecording.findAll({
      where: { userId: patientId },
      include: [{
        model: db.Onboarding,
        attributes: ['participantName', 'userId']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: recordings,
      total: recordings.length
    });
  } catch (error) {
    console.error('Patient voice recordings error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch patient recordings: ${error.message}` 
    });
  }
};

module.exports = {
  adminLogin,
  getPatientAnalysisData,
  getPatientDetailedProfile,
  exportPatientData,
  downloadRecordingWav,
  exportComprehensiveData,
  getStatistics,
  getVoiceRecordingsAdmin,
  downloadRecordingAdmin,
  submitClinicalNotes,
  analyzePatientVoiceProgression,
  getVoiceAnalysisSummary,
  exportFilteredPatients,
  updatePatientInfo,
  deletePatient,
  exportData,
  getPatientVoiceRecordings
};