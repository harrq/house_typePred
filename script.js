// Set this to your FastAPI server origin. Do not include /predict at the end.
const API_BASE_URL = "http://127.0.0.1:8000";
const PREDICT_URL = `${API_BASE_URL}/predict`;
const form = document.getElementById("predictionForm");
const submitButton = document.getElementById("submitButton");
const errorMessage = document.getElementById("errorMessage");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const successState = document.getElementById("successState");
const resultStatus = document.getElementById("resultStatus");
const requiredFields = [...form.querySelectorAll("[required]")];

function updateProgress() {
  const done = requiredFields.filter(f => String(f.value).trim() !== "").length;
  const percent = Math.round(done / requiredFields.length * 100);
  document.getElementById("progressBar").style.width = `${percent}%`;
  document.getElementById("progressText").textContent = `${percent}% complete`;
}
function showState(which) {
  emptyState.hidden = which !== "empty";
  loadingState.hidden = which !== "loading";
  successState.hidden = which !== "success";
}
function showError(message) { errorMessage.textContent = message; errorMessage.hidden = false; }
function clearError() { errorMessage.textContent = ""; errorMessage.hidden = true; }
function setBusy(busy) {
  submitButton.disabled = busy;
  submitButton.classList.toggle("busy", busy);
  submitButton.querySelector(".btn-label").textContent = busy ? "Predicting…" : "Predict room type";
  document.getElementById("apiStatus").textContent = busy ? "Request in progress" : "Ready to test";
}
function validate() {
  for (const field of requiredFields) {
    field.classList.remove("invalid");
    if (!field.checkValidity() || !String(field.value).trim()) {
      field.classList.add("invalid");
      field.focus();
      showError(`Please enter a valid value for ${field.name.replaceAll("_", " ")}.`);
      return false;
    }
  }
  return true;
}
function makePayload() {
  const f = new FormData(form);
  return {
    latitude: Number(f.get("latitude")),
    longitude: Number(f.get("longitude")),
    price: Number(f.get("price")),
    minimum_nights: Number(f.get("minimum_nights")),
    number_of_reviews: Number(f.get("number_of_reviews")),
    reviews_per_month: Number(f.get("reviews_per_month")),
    calculated_host_listings_count: Number(f.get("calculated_host_listings_count")),
    availability_365: Number(f.get("availability_365")),
    neighbourhood_group: String(f.get("neighbourhood_group")).trim(),
    neighbourhood: String(f.get("neighbourhood")).trim()
  };
}
function renderProbabilities(probabilities) {
  const root = document.getElementById("probabilityList");
  root.replaceChildren();
  if (!Array.isArray(probabilities) || !probabilities.length) {
    root.textContent = "No probability values were returned.";
    return;
  }
  probabilities.forEach((raw, i) => {
    const value = Math.max(0, Math.min(1, Number(raw) || 0));
    const row = document.createElement("div");
    row.className = "prob-row";
    const head = document.createElement("div"); head.className = "prob-row-head";
    const roomTypes = ["home/apt", "Private room", "Shared room"];
const label = document.createElement("span");
label.textContent = roomTypes[i] || `Class ${i + 1}`;
    const percent = document.createElement("span"); percent.textContent = `${(value * 100).toFixed(1)}%`;
    head.append(label, percent);
    const track = document.createElement("div"); track.className = "prob-track";
    const fill = document.createElement("div"); fill.className = "prob-fill"; fill.style.width = "0%";
    track.append(fill); row.append(head, track); root.append(row);
    requestAnimationFrame(() => { fill.style.width = `${value * 100}%`; });
  });
}
requiredFields.forEach(field => {
  field.addEventListener("input", () => { field.classList.remove("invalid"); clearError(); updateProgress(); });
  field.addEventListener("change", updateProgress);
});
form.addEventListener("submit", async event => {
  event.preventDefault(); clearError();
  if (!validate()) return;
  setBusy(true); showState("loading"); resultStatus.textContent = "PREDICTING"; resultStatus.className = "status";
  try {
    const response = await fetch(PREDICT_URL, {
      method: "POST", headers: {"Content-Type":"application/json","Accept":"application/json"},
      body: JSON.stringify(makePayload())
    });
    let result;
    try { result = await response.json(); }
    catch { throw new Error("The API did not return JSON. Check that FastAPI is running."); }
    if (!response.ok) {
      const detail = Array.isArray(result.detail)
        ? result.detail.map(e => `${e.loc?.[e.loc.length - 1] || "field"}: ${e.msg}`).join(" · ")
        : (result.detail || `HTTP ${response.status}`);
      throw new Error(`Prediction failed: ${detail}`);
    }
    if (!("Predicted_room_type" in result)) throw new Error("The response is missing Predicted_room_type.");
    document.getElementById("predictionValue").textContent = String(result.Predicted_room_type);
    renderProbabilities(result.Probability);
    showState("success"); resultStatus.textContent = "COMPLETE"; resultStatus.className = "status done";
    document.getElementById("apiStatus").textContent = "Prediction complete";
  } catch (err) {
    showState("empty"); resultStatus.textContent = "NEEDS ATTENTION"; resultStatus.className = "status fail";
    document.getElementById("apiStatus").textContent = "Connection issue";
    showError(err instanceof TypeError
      ? `Cannot connect to ${PREDICT_URL}. Start FastAPI, confirm the URL, and check CORS settings.`
      : (err.message || "Something went wrong."));
  } finally { setBusy(false); }
});
document.getElementById("resetButton").addEventListener("click", () => {
  form.reset(); requiredFields.forEach(f => f.classList.remove("invalid")); clearError(); updateProgress();
  showState("empty"); resultStatus.textContent = "WAITING"; resultStatus.className = "status";
  document.getElementById("predict").scrollIntoView({behavior:"smooth",block:"start"});
});
updateProgress();