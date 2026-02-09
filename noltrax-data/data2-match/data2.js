// ================================
// GLOBAL STATE
// ================================

let matchData = null;
let analysisResults = null;

// ================================
// FILE UPLOAD HANDLING
// ================================

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const analyzeBtn = document.getElementById("analyzeBtn");

console.log("Upload elements initialized:", {
  dropZone: !!dropZone,
  fileInput: !!fileInput,
  fileInfo: !!fileInfo,
  fileName: !!fileName,
  analyzeBtn: !!analyzeBtn
});

// Drag & Drop
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add("drag-over");
  console.log("Dragover event");
});

dropZone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove("drag-over");
  console.log("Dragleave event");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove("drag-over");
  console.log("Drop event triggered");
  
  const files = e.dataTransfer.files;
  console.log("Files dropped:", files.length);
  
  if (files.length > 0) {
    console.log("Processing file:", files[0].name);
    handleFile(files[0]);
  }
});

// Browse button click handler
const uploadBtn = document.querySelector(".upload-btn");
if (uploadBtn) {
  uploadBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Browse button clicked");
    fileInput.click();
  });
}

// File input change
fileInput.addEventListener("change", (e) => {
  console.log("File input change event");
  console.log("Files selected:", e.target.files.length);
  
  if (e.target.files.length > 0) {
    console.log("Processing selected file:", e.target.files[0].name);
    handleFile(e.target.files[0]);
  }
});

function handleFile(file) {
  console.log("=== HANDLE FILE CALLED ===");
  console.log("File object:", file);
  console.log("File name:", file.name);
  console.log("File size:", file.size);
  console.log("File type:", file.type);
  
  if (!file) {
    alert("❌ No file received!");
    return;
  }
  
  if (!file.name.endsWith(".json")) {
    alert("❌ Please upload a valid JSON file from Noltrax Match\n\nFile selected: " + file.name);
    return;
  }

  console.log("File validation passed, reading file...");

  const reader = new FileReader();
  
  reader.onloadstart = () => {
    console.log("FileReader started");
  };
  
  reader.onprogress = (e) => {
    console.log("Reading progress:", e.loaded, "/", e.total);
  };
  
  reader.onload = (e) => {
    console.log("=== FILE READ COMPLETE ===");
    console.log("Result length:", e.target.result.length);
    
    try {
      matchData = JSON.parse(e.target.result);
      console.log("=== JSON PARSED SUCCESSFULLY ===");
      console.log("Match data:", matchData);
      
      // Validate data structure
      if (!matchData.meta) {
        throw new Error("Missing metadata in JSON file");
      }
      
      if (!matchData.timeline) {
        console.warn("No timeline data found, creating empty array");
        matchData.timeline = [];
      }
      
      if (!matchData.pitchData) {
        console.warn("No pitch data found, creating empty structure");
        matchData.pitchData = {
          pitch1: { arrows: [], players: [] },
          pitch2: { arrows: [], players: [] }
        };
      }

      console.log("Setting file name:", file.name);
      fileName.textContent = file.name;
      
      console.log("Showing file info");
      fileInfo.style.display = "block";
      
      console.log("=== FILE LOADED SUCCESSFULLY ===");
      alert("✅ File loaded: " + file.name + "\n\nClick 'Generate Analysis' to continue");
      
    } catch (error) {
      console.error("=== JSON PARSE ERROR ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      alert("❌ Invalid JSON file: " + error.message + "\n\nPlease check the file format.");
    }
  };
  
  reader.onerror = (error) => {
    console.error("=== FILEREADER ERROR ===");
    console.error("Error:", error);
    alert("❌ Error reading file. Please try again.\n\nError: " + reader.error);
  };
  
  console.log("Starting to read file as text...");
  reader.readAsText(file);
  console.log("readAsText called");
}

// Analyze button
analyzeBtn.addEventListener("click", () => {
  if (!matchData) return;
  
  // Run analysis
  analysisResults = analyzeMatch(matchData);
  
  // Populate preview
  populatePreview(matchData, analysisResults);
  
  // Show preview section
  document.getElementById("uploadSection").style.display = "none";
  document.getElementById("previewSection").style.display = "block";
  
  // Scroll to top
  window.scrollTo(0, 0);
});

// Back button
document.getElementById("backBtn").addEventListener("click", () => {
  document.getElementById("previewSection").style.display = "none";
  document.getElementById("uploadSection").style.display = "block";
});

// ================================
// ANALYSIS ENGINE
// ================================

function analyzeMatch(data) {
  const results = {
    structural: analyzeStructure(data.pitchData),
    behavioral: analyzeBehavior(data.timeline),
    temporal: analyzeTemporal(data.timeline),
    rhythm: analyzeRhythm(data.timeline),
    confidence: assessConfidence(data)
  };

  // Generate synthesis
  results.synthesis = generateSynthesis(results, data);
  
  // Generate coaching questions
  results.coachingQuestions = generateCoachingQuestions(results, data);

  return results;
}

// ================================
// STRUCTURAL ANALYSIS (FIXED - HORIZONTAL)
// ================================

function analyzeStructure(pitchData) {
  const results = {
    pitch1: analyzePitch(pitchData.pitch1),
    pitch2: analyzePitch(pitchData.pitch2)
  };

  return results;
}

function analyzePitch(pitch) {
  if (!pitch.players || pitch.players.length === 0) {
    return {
      shape: "No data",
      occupation: "No data",
      players: []
    };
  }

  const players = pitch.players;
  
  // Shape detection based on HORIZONTAL clustering (X axis = left to right)
  const shape = detectFormation(players);
  
  // Occupation bias (top/bottom/central)
  const occupation = analyzeOccupation(players);

  return { shape, occupation, players };
}

function detectFormation(players) {
  if (players.length < 10) return "Incomplete lineup";

  // Sort players by X position (HORIZONTAL - left to right)
  const sorted = [...players].sort((a, b) => a.x - b.x);

  // Exclude GK (first player from left)
  const outfield = sorted.slice(1);

  // Divide pitch into VERTICAL bands (left to right)
  const bands = {
    defense: outfield.filter(p => p.x < 33),      // Left third
    midfield: outfield.filter(p => p.x >= 33 && p.x < 66), // Middle third
    attack: outfield.filter(p => p.x >= 66)       // Right third
  };

  const def = bands.defense.length;
  const mid = bands.midfield.length;
  const att = bands.attack.length;

  // Pattern matching
  if (def === 4 && mid === 3 && att === 3) return "4-3-3";
  if (def === 4 && mid === 4 && att === 2) return "4-4-2";
  if (def === 4 && mid === 2 && att === 4) return "4-2-3-1";
  if (def === 3 && mid === 5 && att === 2) return "3-5-2";
  if (def === 3 && mid === 4 && att === 3) return "3-4-3";
  if (def === 5 && mid === 3 && att === 2) return "5-3-2";
  if (def === 2 && mid === 4 && att === 4) return "2-4-4";
  if (def === 3 && mid === 3 && att === 4) return "3-3-4";
  
  return `${def}-${mid}-${att}`;
}

function analyzeOccupation(players) {
  if (players.length === 0) return "Balanced";

  // For HORIZONTAL pitch: Y axis = top to bottom
  const topZone = players.filter(p => p.y < 33).length;
  const centerZone = players.filter(p => p.y >= 33 && p.y < 66).length;
  const bottomZone = players.filter(p => p.y >= 66).length;

  const max = Math.max(topZone, centerZone, bottomZone);

  if (topZone === max && topZone > centerZone + 2) return "Upper-sided emphasis";
  if (bottomZone === max && bottomZone > centerZone + 2) return "Lower-sided emphasis";
  if (centerZone === max) return "Central dominance";

  return "Balanced occupation";
}

// ================================
// BEHAVIORAL ANALYSIS
// ================================

function analyzeBehavior(timeline) {
  if (!timeline || timeline.length === 0) {
    return {
      total: 0,
      dominant: "N/A",
      distribution: {},
      variety: 0
    };
  }

  const distribution = {};
  
  timeline.forEach(event => {
    const action = event.actionType;
    distribution[action] = (distribution[action] || 0) + 1;
  });

  const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0] ? sorted[0][0] : "N/A";
  const dominantCount = sorted[0] ? sorted[0][1] : 0;
  const dominantPercent = ((dominantCount / timeline.length) * 100).toFixed(1);

  return {
    total: timeline.length,
    dominant: `${dominant} (${dominantPercent}%)`,
    distribution,
    variety: Object.keys(distribution).length
  };
}

// ================================
// TEMPORAL ANALYSIS
// ================================

function analyzeTemporal(timeline) {
  if (!timeline || timeline.length === 0) {
    return {
      maxMinute: 0,
      peakPeriod: "N/A",
      density: [],
      insight: "Insufficient data for temporal analysis."
    };
  }

  // Create 5-minute bins
  const bins = {};
  const maxMinute = Math.max(...timeline.map(e => e.minute));

  for (let i = 0; i <= maxMinute; i += 5) {
    bins[i] = 0;
  }

  timeline.forEach(event => {
    const bin = Math.floor(event.minute / 5) * 5;
    bins[bin] = (bins[bin] || 0) + 1;
  });

  const densityArray = Object.entries(bins).map(([min, count]) => ({
    minute: parseInt(min),
    count
  }));

  // Find peak period
  const peakBin = densityArray.reduce((max, curr) => 
    curr.count > max.count ? curr : max
  , densityArray[0]);

  const peakPeriod = `${peakBin.minute}-${peakBin.minute + 5} min`;

  return {
    maxMinute,
    peakPeriod,
    density: densityArray,
    peakBin
  };
}

// ================================
// RHYTHM ANALYSIS
// ================================

function analyzeRhythm(timeline) {
  if (!timeline || timeline.length < 2) {
    return {
      intervals: [],
      avgInterval: 0,
      stability: "N/A"
    };
  }

  const sorted = [...timeline].sort((a, b) => 
    (a.minute * 60 + a.second) - (b.minute * 60 + b.second)
  );

  const intervals = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].minute * 60 + sorted[i - 1].second;
    const curr = sorted[i].minute * 60 + sorted[i].second;
    intervals.push(curr - prev);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  
  // Calculate standard deviation
  const variance = intervals.reduce((sum, val) => 
    sum + Math.pow(val - avgInterval, 2), 0
  ) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation
  const cv = (stdDev / avgInterval) * 100;

  let stability;
  if (cv < 30) stability = "Stable rhythm";
  else if (cv < 60) stability = "Moderate fluctuation";
  else stability = "Highly irregular rhythm";

  return {
    intervals,
    avgInterval: avgInterval.toFixed(1),
    stability,
    cv: cv.toFixed(1)
  };
}

// ================================
// CONFIDENCE ASSESSMENT
// ================================

function assessConfidence(data) {
  let score = 0;
  const limitations = [];

  // Data completeness
  if (data.timeline && data.timeline.length >= 20) score += 30;
  else {
    limitations.push("Limited event logging (< 20 actions recorded)");
    score += 10;
  }

  if (data.pitchData.pitch1.players.length >= 10) score += 20;
  else limitations.push("Incomplete formation data for first half");

  if (data.pitchData.pitch2.players.length >= 10) score += 20;
  else limitations.push("Incomplete formation data for second half");

  if (data.meta.matchName && data.meta.matchDate) score += 10;
  
  if (data.strategyNotes && Object.values(data.strategyNotes).some(n => n.length > 10)) {
    score += 20;
  } else {
    limitations.push("Minimal analyst notes provided");
  }

  let level, reason;
  
  if (score >= 75) {
    level = "High";
    reason = "Comprehensive data coverage with detailed logging and formation analysis.";
  } else if (score >= 45) {
    level = "Medium";
    reason = "Adequate data for general insights, though some areas lack depth.";
  } else {
    level = "Low";
    reason = "Limited data restricts interpretation accuracy. Additional logging recommended.";
  }

  return { level, reason, score, limitations };
}

// ================================
// AUTO-WORDING SYNTHESIS
// ================================

function generateSynthesis(results, data) {
  const structural = results.structural;
  const behavioral = results.behavioral;
  const temporal = results.temporal;

  let text = "";

  // Structure
  if (structural.pitch1.shape !== "No data") {
    text += `The team deployed a ${structural.pitch1.shape} formation`;
    
    if (structural.pitch1.occupation !== "Balanced occupation") {
      text += ` with ${structural.pitch1.occupation.toLowerCase()}`;
    }
    
    if (structural.pitch2.shape !== "No data" && structural.pitch2.shape !== structural.pitch1.shape) {
      text += `, transitioning to a ${structural.pitch2.shape} in the second half`;
    }
    
    text += ". ";
  }

  // Behavior
  if (behavioral.total > 0) {
    const dominantAction = behavioral.dominant.split(" (")[0];
    text += `Behaviorally, the team prioritized ${dominantAction.toLowerCase()} actions (${behavioral.dominant.split("(")[1].replace(")", "")}), `;
    text += `recording ${behavioral.total} total actions across ${behavioral.variety} distinct categories. `;
  }

  // Temporal
  if (temporal.peakPeriod !== "N/A") {
    text += `Match activity peaked during the ${temporal.peakPeriod} period, indicating heightened intensity during this phase. `;
  }

  // Rhythm
  const rhythm = results.rhythm;
  if (rhythm.stability !== "N/A") {
    text += `The team's action rhythm exhibited ${rhythm.stability.toLowerCase()}, with an average interval of ${rhythm.avgInterval} seconds between recorded events. `;
  }

  // Conclusion
  text += "Collectively, these patterns suggest ";
  
  if (behavioral.total > 30 && rhythm.stability.includes("Stable")) {
    text += "a well-coordinated and consistent approach to the match.";
  } else if (behavioral.total < 15) {
    text += "limited on-ball activity or selective event logging.";
  } else {
    text += "a dynamic tactical approach with varied action execution.";
  }

  return text;
}

// ================================
// COACHING QUESTIONS GENERATOR
// ================================

function generateCoachingQuestions(results, data) {
  const questions = [];

  // Structural
  if (results.structural.pitch1.shape !== "No data") {
    if (results.structural.pitch1.occupation.includes("emphasis")) {
      const side = results.structural.pitch1.occupation.includes("Upper") ? "upper" : "lower";
      const opposite = side === "upper" ? "lower" : "upper";
      questions.push({
        category: "Structural",
        text: `Why was the ${opposite} zone underutilized despite the formation allowing width on both sides?`
      });
    }

    if (results.structural.pitch2.shape !== results.structural.pitch1.shape && 
        results.structural.pitch2.shape !== "No data") {
      questions.push({
        category: "Structural",
        text: `What triggered the tactical shift from ${results.structural.pitch1.shape} to ${results.structural.pitch2.shape}? Was it reactive or pre-planned?`
      });
    }
  }

  // Behavioral
  if (results.behavioral.total > 0) {
    const dominant = results.behavioral.dominant.split(" (")[0];
    
    if (dominant.toLowerCase().includes("pressing") || dominant.toLowerCase().includes("press")) {
      questions.push({
        category: "Behavioral",
        text: `Was the pressing intensity sustainable throughout the match, or did it lead to defensive vulnerabilities in later phases?`
      });
    }

    if (results.behavioral.variety < 4 && results.behavioral.total > 15) {
      questions.push({
        category: "Behavioral",
        text: `The limited action variety suggests a narrow tactical focus. Was this intentional specialization or reactive simplification?`
      });
    }
  }

  // Temporal
  if (results.temporal.peakBin) {
    const peakMin = results.temporal.peakBin.minute;
    if (peakMin < 15) {
      questions.push({
        category: "Temporal",
        text: `Early match intensity peaked in the opening ${peakMin + 5} minutes. Did this reflect a proactive game plan or opponent vulnerability?`
      });
    } else if (peakMin > 75) {
      questions.push({
        category: "Temporal",
        text: `The late surge in activity (${peakMin}+ minutes) suggests either a comeback attempt or defensive pressure. Which scenario occurred?`
      });
    }
  }

  // Rhythm
  if (results.rhythm.stability.includes("irregular")) {
    questions.push({
      category: "Rhythm",
      text: `The highly irregular action rhythm indicates reactive rather than controlled play. What factors disrupted the team's intended tempo?`
    });
  }

  // Reflection
  questions.push({
    category: "Reflection",
    text: `Based on this analysis, which tactical element—structure, behavior, or timing—requires the most immediate adjustment for future matches?`
  });

  // Limit to 5 questions
  return questions.slice(0, 5);
}

// ================================
// POPULATE PREVIEW
// ================================

function populatePreview(data, results) {
  // Cover page
  document.getElementById("coverTitle").textContent = data.meta.matchName || "MATCH ANALYSIS REPORT";
  document.getElementById("coverTeams").textContent = `${data.meta.homeTeam || "Home"} vs ${data.meta.awayTeam || "Away"}`;
  document.getElementById("coverDate").textContent = data.meta.matchDate || "Date not specified";
  document.getElementById("coverCompetition").textContent = "Competition: TBD";
  document.getElementById("coverAnalyzedTeam").textContent = data.meta.analyzedTeam || "N/A";
  document.getElementById("coverAnalyst").textContent = data.meta.analyst || "N/A";

  // Match info
  let matchDetails = `
    <p><strong>Match:</strong> ${data.meta.matchName || "N/A"}</p>
    <p><strong>Date:</strong> ${data.meta.matchDate || "N/A"}</p>
    <p><strong>Home Team:</strong> ${data.meta.homeTeam || "N/A"}</p>
    <p><strong>Away Team:</strong> ${data.meta.awayTeam || "N/A"}</p>
    <p><strong>Analyzed Team:</strong> ${data.meta.analyzedTeam || "N/A"}</p>
  `;
  document.getElementById("matchDetails").innerHTML = matchDetails;

  // Squad
  if (data.squad && data.squad.starters) {
    const starters = data.squad.starters
      .filter(p => p.number)
      .map(p => `<p><strong>${p.number}</strong> - ${p.position} - ${p.name}</p>`)
      .join("");
    document.getElementById("startingXI").innerHTML = starters || "<p>No data</p>";

    const subs = data.squad.substitutes
      .filter(p => p.number)
      .map(p => `<p><strong>${p.number}</strong> - ${p.position} - ${p.name}</p>`)
      .join("");
    document.getElementById("substitutes").innerHTML = subs || "<p>No data</p>";
  }

  // Draw pitches
  drawPitchVisualization("pitchCanvas1", results.structural.pitch1);
  drawPitchVisualization("pitchCanvas2", results.structural.pitch2);

  document.getElementById("shape1").textContent = results.structural.pitch1.shape;
  document.getElementById("occupation1").textContent = results.structural.pitch1.occupation;
  document.getElementById("shape2").textContent = results.structural.pitch2.shape;
  document.getElementById("occupation2").textContent = results.structural.pitch2.occupation;

  // Structural insight
  let structuralText = "";
  if (results.structural.pitch1.shape !== "No data") {
    structuralText = `The team consistently formed a ${results.structural.pitch1.shape} shape`;
    if (results.structural.pitch1.occupation !== "Balanced occupation") {
      structuralText += ` with ${results.structural.pitch1.occupation.toLowerCase()}`;
    }
    structuralText += ", suggesting a deliberate tactical emphasis in spatial occupation.";
    
    if (results.structural.pitch2.shape !== "No data" && 
        results.structural.pitch2.shape !== results.structural.pitch1.shape) {
      structuralText += ` A transition to ${results.structural.pitch2.shape} in the second half indicates adaptive tactical flexibility.`;
    }
  } else {
    structuralText = "Insufficient formation data to generate structural insight.";
  }
  document.getElementById("structuralInsight").textContent = structuralText;

  // Action summary
  document.getElementById("totalActions").textContent = results.behavioral.total;
  document.getElementById("dominantAction").textContent = results.behavioral.dominant.split(" (")[0];
  document.getElementById("actionVariety").textContent = results.behavioral.variety;

  // Charts
  createActionChart(results.behavioral.distribution);
  createTimelineChart(results.temporal.density);
  createRhythmChart(results.rhythm.intervals);

  // Temporal insight
  let temporalText = "";
  if (results.temporal.peakPeriod !== "N/A") {
    temporalText = `Match activity peaked between minutes ${results.temporal.peakPeriod}, indicating a concentrated period of tactical execution. `;
    
    if (results.temporal.peakBin.minute < 20) {
      temporalText += "This early intensity suggests a proactive game plan focused on establishing dominance from the outset.";
    } else if (results.temporal.peakBin.minute > 70) {
      temporalText += "The late surge in activity reflects either increased defensive pressure or an attacking push in the final stages.";
    } else {
      temporalText += "This mid-match peak indicates strong control during the central phase of the game.";
    }
  } else {
    temporalText = "Insufficient temporal data for meaningful insight.";
  }
  document.getElementById("temporalInsight").textContent = temporalText;

  // Rhythm insight
  let rhythmText = `The team's action rhythm was characterized as ${results.rhythm.stability.toLowerCase()}`;
  if (results.rhythm.stability.includes("Stable")) {
    rhythmText += ", indicating controlled, deliberate execution.";
  } else if (results.rhythm.stability.includes("Moderate")) {
    rhythmText += ", suggesting periods of both structured play and reactive adjustments.";
  } else {
    rhythmText += ", reflecting a highly reactive approach driven by match circumstances rather than planned tempo.";
  }
  document.getElementById("rhythmInsight").textContent = rhythmText;

  // Synthesis
  document.getElementById("synthesisSummary").textContent = results.synthesis;

  // Coaching questions
  const questionsHTML = results.coachingQuestions.map(q => `
    <div class="question-item">
      <div class="question-category">${q.category}</div>
      <div class="question-text">${q.text}</div>
    </div>
  `).join("");
  document.getElementById("coachingQuestions").innerHTML = questionsHTML;

  // Confidence
  document.getElementById("confidenceLevel").textContent = results.confidence.level.toUpperCase();
  document.getElementById("confidenceBadge").className = `confidence-badge ${results.confidence.level.toLowerCase()}`;
  document.getElementById("confidenceReason").textContent = results.confidence.reason;

  // Limitations
  const limitationsHTML = results.confidence.limitations.length > 0
    ? results.confidence.limitations.map(l => `<li>${l}</li>`).join("")
    : "<li>No significant limitations identified</li>";
  document.getElementById("limitationsList").innerHTML = limitationsHTML;

  // Strategy notes
  if (data.strategyNotes) {
    const notesHTML = `
      ${data.strategyNotes.compete ? `<div class="note-section"><h4>Compete</h4><p>${data.strategyNotes.compete}</p></div>` : ""}
      ${data.strategyNotes.competeNotes ? `<div class="note-section"><h4>Compete Notes</h4><p>${data.strategyNotes.competeNotes}</p></div>` : ""}
      ${data.strategyNotes.control ? `<div class="note-section"><h4>Control</h4><p>${data.strategyNotes.control}</p></div>` : ""}
      ${data.strategyNotes.controlNotes ? `<div class="note-section"><h4>Control Notes</h4><p>${data.strategyNotes.controlNotes}</p></div>` : ""}
      ${data.strategyNotes.concepts ? `<div class="note-section"><h4>Concepts</h4><p>${data.strategyNotes.concepts}</p></div>` : ""}
      ${data.strategyNotes.conceptsNotes ? `<div class="note-section"><h4>Concepts Notes</h4><p>${data.strategyNotes.conceptsNotes}</p></div>` : ""}
      ${data.strategyNotes.individualTargets ? `<div class="note-section"><h4>Individual Targets</h4><p>${data.strategyNotes.individualTargets}</p></div>` : ""}
      ${data.strategyNotes.individualTargetsNotes ? `<div class="note-section"><h4>Individual Targets Notes</h4><p>${data.strategyNotes.individualTargetsNotes}</p></div>` : ""}
    `;
    document.getElementById("strategyNotesDisplay").innerHTML = notesHTML || "<p>No analyst notes provided</p>";
  }
}

// ================================
// PITCH VISUALIZATION (HORIZONTAL)
// ================================

function drawPitchVisualization(canvasId, pitchData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  const width = canvas.width = 700;
  const height = canvas.height = 450;

  ctx.clearRect(0, 0, width, height);

  const padding = 40;
  const pitchWidth = width - (padding * 2);
  const pitchHeight = height - (padding * 2);

  // Pitch outline
  ctx.strokeStyle = "#d0d0d0";
  ctx.lineWidth = 2;
  ctx.strokeRect(padding, padding, pitchWidth, pitchHeight);

  // Center line (vertical)
  ctx.beginPath();
  ctx.moveTo(width / 2, padding);
  ctx.lineTo(width / 2, height - padding);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 40, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#d0d0d0";
  ctx.fill();

  // Left penalty area
  const penaltyWidth = pitchWidth * 0.18;
  const penaltyHeight = pitchHeight * 0.4;
  ctx.strokeRect(
    padding, 
    padding + (pitchHeight - penaltyHeight) / 2, 
    penaltyWidth, 
    penaltyHeight
  );

  // Right penalty area
  ctx.strokeRect(
    width - padding - penaltyWidth, 
    padding + (pitchHeight - penaltyHeight) / 2, 
    penaltyWidth, 
    penaltyHeight
  );

  // Left goal area
  const goalWidth = pitchWidth * 0.06;
  const goalHeight = pitchHeight * 0.2;
  ctx.strokeRect(
    padding, 
    padding + (pitchHeight - goalHeight) / 2, 
    goalWidth, 
    goalHeight
  );

  // Right goal area
  ctx.strokeRect(
    width - padding - goalWidth, 
    padding + (pitchHeight - goalHeight) / 2, 
    goalWidth, 
    goalHeight
  );

  // Penalty spots
  ctx.beginPath();
  ctx.arc(padding + penaltyWidth * 0.6, height / 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width - padding - penaltyWidth * 0.6, height / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Draw players
  if (pitchData.players && pitchData.players.length > 0) {
    pitchData.players.forEach(player => {
      const px = padding + (player.x / 100) * pitchWidth;
      const py = padding + (player.y / 100) * pitchHeight;

      ctx.fillStyle = "#1e5eff";
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "white";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(player.number, px, py);
    });
  } else {
    ctx.fillStyle = "#999";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No formation data", width / 2, height / 2);
  }

  // Draw arrows
  if (pitchData.arrows && pitchData.arrows.length > 0) {
    pitchData.arrows.forEach(arrow => {
      drawArrowOnCanvas(ctx, arrow.startX, arrow.startY, arrow.endX, arrow.endY);
    });
  }
}

function drawArrowOnCanvas(ctx, fromX, fromY, toX, toY) {
  const headlen = 10;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  
  ctx.strokeStyle = "#ff6b6b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

// ================================
// CHART GENERATION
// ================================

function createActionChart(distribution) {
  const ctx = document.getElementById("actionChart");
  if (!ctx) return;

  const labels = Object.keys(distribution);
  const data = Object.values(distribution);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Action Count",
        data: data,
        backgroundColor: "#1e5eff",
        borderColor: "#0044cc",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
}

function createTimelineChart(density) {
  const ctx = document.getElementById("timelineChart");
  if (!ctx) return;

  const labels = density.map(d => `${d.minute}'`);
  const data = density.map(d => d.count);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Actions per 5 min",
        data: data,
        backgroundColor: "rgba(30, 94, 255, 0.2)",
        borderColor: "#1e5eff",
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
}

function createRhythmChart(intervals) {
  const ctx = document.getElementById("rhythmChart");
  if (!ctx) return;

  const labels = intervals.map((_, i) => `Event ${i + 1}`);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Interval (seconds)",
        data: intervals,
        backgroundColor: "rgba(30, 94, 255, 0.1)",
        borderColor: "#1e5eff",
        borderWidth: 2,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Seconds between actions"
          }
        },
        x: {
          display: false
        }
      }
    }
  });
}

// ================================
// PDF GENERATION
// ================================

document.getElementById("downloadPdfBtn").addEventListener("click", async () => {
  const loadingOverlay = document.getElementById("loadingOverlay");
  loadingOverlay.style.display = "flex";

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const pages = document.querySelectorAll(".pdf-page");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();

      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      if (imgHeight > pageHeight) {
        const ratio = pageHeight / imgHeight;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth * ratio, pageHeight);
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }
    }

    const fileName = matchData.meta.matchName
      ? `${matchData.meta.matchName.replace(/\s/g, "_")}_Analysis.pdf`
      : "Noltrax_Analysis.pdf";

    pdf.save(fileName);

  } catch (error) {
    console.error("PDF generation error:", error);
    alert("❌ Error generating PDF. Please try again.");
  } finally {
    loadingOverlay.style.display = "none";
  }
});
