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
// STRUCTURAL ANALYSIS
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
  
  // Shape detection based on vertical clustering
  const shape = detectFormation(players);
  
  // Occupation bias (left/right/central)
  const occupation = analyzeOccupation(players);

  return { shape, occupation, players };
}

function detectFormation(players) {
  if (players.length < 10) return "Incomplete lineup";

  // Sort players by Y position (vertical)
  const sorted = [...players].sort((a, b) => a.y - b.y);

  // Exclude GK (first player)
  const outfield = sorted.slice(1);

  // Divide pitch into horizontal bands
  const bands = {
    defense: outfield.filter(p => p.y < 33),
    midfield: outfield.filter(p => p.y >= 33 && p.y < 66),
    attack: outfield.filter(p => p.y >= 66)
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
  
  return `${def}-${mid}-${att}`;
}

function analyzeOccupation(players) {
  if (players.length === 0) return "Balanced";

  const leftZone = players.filter(p => p.x < 33).length;
  const centerZone = players.filter(p => p.x >= 33 && p.x < 66).length;
  const rightZone = players.filter(p => p.x >= 66).length;

  const max = Math.max(leftZone, centerZone, rightZone);

  if (leftZone === max && leftZone > centerZone + 2) return "Left-sided emphasis";
  if (rightZone === max && rightZone > centerZone + 2) return "Right-sided emphasis";
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
      const side = results.structural.pitch1.occupation.includes("Left") ? "left" : "right";
      const opposite = side === "left" ? "right" : "left";
      questions.push({
        category: "Structural",
        text: `Why was the ${opposite} flank underutilized despite the formation allowing width on both sides?`
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
  document.getElementById("coverCompetition").textContent = "Competition: TBD"; // Can be added to meta
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
    structuralText = `The team consistently formed a ${results.structur
