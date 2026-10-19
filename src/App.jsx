import { useEffect, useState } from "react";
import "./index.css"

function App() {

  const [currentStep, setCurrentStep] = useState(1);

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] =  useState(null);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState("");

  const [customerDetails, setCustomerDetails] = useState({
    fullName: "", 
    email: "", 
    phone: "",
    purpose: "", 
    notes: ""
  });

  const [detailsVerified, setDetailsVerified] = useState(false);

  useEffect(() => {
    async function fetchRooms() {
      try{
        const response = await fetch("http://localhost:3001/rooms");
        if (!response.ok){
          throw new Error("Failed to fetch rooms.")
        }
        const data = await response.json();
        setRooms(data)
      }
      catch (error){
        setError("Failed to load rooms. Try again.");
        console.log(error);
      }
      finally{
        setLoading(false);
      }
    }
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;

    async function fetchSlots() {
      setSlotLoading(true);
      setSlotError("");
      setSelectedSlot(null);

      try {
        const response = await fetch(`http://localhost:3001/slots?roomId=${selectedRoom.id}`);

        if (!response.ok){
          throw new Error("Failed to fetch time slots.");
        }
        const data = await response.json();
        setSlots(data);
      } 
      catch (error) {
        console.error(error);
        setSlotError("Failed to load time slots. Try again.");
        setSlots([]);
      }
      finally {
        setSlotLoading(false);
      }
    }
    fetchSlots();
  }, [selectedRoom]);

  function verifyDetails(){
    const {fullName, email, phone, purpose} = customerDetails;

    if(!fullName.trim() || !email.trim() || !phone.trim() || !purpose.trim()){
      setDetailsVerified(false);
      alert("Please fill all required fields.");
      return;
    }

    setDetailsVerified(true);
  }

  return (
    <>
      <div className="app">
        <header className="header">
          <h1>BookaRoom</h1>
          <p>Room Reservation</p>
        </header>

        <main className="booking-container">
          <div className="step-progress">
            {[
              {number: 1, title: "Choose Room", description: "Select a room"},
              {number: 2, title: "Date & Time", description: "Pick a date and time"},
              {number: 3, title: "Your Details", description: "Enter your details"},
              {number: 4, title: "Review", description: "Check your booking"},
              {number: 5, title: "Confirmation", description: "Booking complete"}
            ].map((step, index, steps) => (
              <div className="step-wrapper" key={step.number}>
                <div className={`step-item ${currentStep === step.number ? "active" : currentStep > step.number ? "completed" : ""}`}>
                  <div className="step-number">
                    {currentStep > step.number ? "✔" : step.number}
                  </div>

                  <div className="step-info">
                    <span className="step-title">{step.title}</span>
                    <span className="step-desc">{step.description}</span>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className={`step-line ${currentStep > step.number ? "completed" : ""}`}>
                  </div>
              )}
            </div>
            ))}
          </div>

          <section className="booking-content">
            {currentStep === 1 && (
              <>
              <div className="room-heading">
                <h2>Find your space</h2>
                <p>Choose a room for your meeting.</p>
                <div className="find-bar">
                  <div className="search-room">
                    Search
                  </div>
                  <div className="filter-room">
                    Filter
                  </div>
                </div>
              </div>

              <div className="rooms-avail">
                <p>Available rooms : ({rooms.length})</p>
                {loading ? (<p>Loading rooms...</p>) : error ? (<p>{error}</p>) : rooms.length === 0 ? (<p>No rooms available.</p>) : (
                  <div className="room-cards">
                    {rooms.map((room) => (
                      <div key={room.id} className={`room-x ${selectedRoom?.id === room.id ? "selected" : ""}`} onClick={() => setSelectedRoom(room)}>
                        <img src={room.image} alt={room.name} />
                        <div className="room-info">
                          <h3>{room.name}</h3>
                          <p>{room.capacity} guests</p>
                          <p>{room.facilities?.join(" · ")}</p>
                          <div className="room-card-footer">
                            <strong>Rp{Number(room.pricePerHour).toLocaleString("id-ID")} {" / hour"}</strong>
                            <button className={`room-card ${selectedRoom?.id === room.id ? "selected" : ""}`}>{selectedRoom?.id === room.id ? "Selected" : "Select room →"}</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </>
            )}

            {currentStep === 2 && (
              <div className="room-heading">
                <h2>When would you like to meet ?</h2>
                <p>Pick your booking date and available time slot.</p>
                <div className="date-container">
                  <div className="calendar">
                    <h3>Select date</h3>
                    <input type="date" 
                    value={selectedDate}
                    min={new Date().toLocaleDateString("en-CA")}
                    onChange={(e) => setSelectedDate(e.target.value)}/>
                  </div>
                  <div className="slots">
                    <div className="time-slots">
                      <h3>Available time slots</h3>
                      {!selectedRoom ? (
                        <p>Select a room first.</p>
                      ) : slotLoading ? (
                        <p>Loading time slots</p>
                      ) : slotError ? (
                        <p>{slotError}</p>
                      ) : slots.filter((slot) => slot.isAvailable).length === 0 ? (
                        <p>No available time slots for this room.</p>
                      ) : (
                        <div className="time-slot-grid">
                          {slots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={!slot.isAvailable}
                              className={`time-slot ${
                                selectedSlot?.id === slot.id ? "selected" : ""
                              } ${!slot.isAvailable ? "unavailable" : ""}`}
                              onClick={() => setSelectedSlot(slot)}>
                                {slot.time}
                                {!slot.isAvailable && (
                                <span className="slot-status">Booked</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="date-selection-footer">
                  <h3>YOUR SELECTION</h3>
                  <p>Room : {selectedRoom?.name || "Not selected"}</p>
                  <p>Date : {selectedDate || "Not selected"}</p>
                  <p>Time : {selectedSlot?.time || "Not selected"}</p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="details-page">
                <div className="room-heading">
                  <h2>Your details</h2>
                  <p>Tell us a little about yourself to compelete your reservation.</p>
                </div> 

                <div className="details-layout">
                  <form className="details-form" onSubmit={(e) => {e.preventDefault(); setCurrentStep(4)}}>
                    <h3>Contact Information</h3>
                    <p className="form-hint">* Required Fields</p>
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name *</label>
                      <input type="text" id="fullName" placeholder="Enter your full name" value={customerDetails.fullName} onChange={(e) => setCustomerDetails({...customerDetails, fullName: e.target.value})} required />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input type="email" id="email" placeholder="abc@gmail.com" value={customerDetails.email} onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})} required/>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input type="tel" id="phone" placeholder="Enter your phone number" value={customerDetails.phone} onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})} required/>
                    </div>

                    <div className="form-group">
                      <label htmlFor="purpose">Purpose of Booking *</label>
                      <input type="text" id="purpose" placeholder="e.g. Team meeting, project discussion" value={customerDetails.purpose} onChange={(e) => setCustomerDetails({...customerDetails, purpose: e.target.value})} required/>
                    </div>

                    <div className="form-group">
                      <label htmlFor="notes">Additional Notes</label>
                      <input type="text" id="notes" placeholder="Any special requests ?" value={customerDetails.notes} onChange={(e) => setCustomerDetails({...customerDetails, notes: e.target.value})}/>
                    </div>
                  </form>
                  <button type="submit" className={`verify-details ${detailsVerified ? "verified" : ""}`} onClick={verifyDetails}>
                    {detailsVerified ? "Verified" : "Verify Details"}
                  </button>
                </div>               
              </div>
            )}

            {currentStep === 4 && (
              <div className="review-page">
                <div className="room-heading">
                  <h2>Review your booking</h2>
                  <p>Check your reservation details before confirming.</p>
                </div>
                
                <div className="review-card-layout">
                  <div className="review-card">
                    <h3>Room Details</h3>
                    <p>Room : {selectedRoom?.name}</p>
                    <p>Date : {selectedDate || "Not Selected"}</p>
                    <p>Time : {selectedSlot?.time || "Not Selected"}</p>
                    <p>Price per Hour : Rp {Number(selectedRoom?.pricePerHour).toLocaleString("id-ID")}</p>
                  </div>

                  <div className="review-card">
                    <h3>Your Details</h3>
                    <p>Name : {customerDetails.fullName}</p>
                    <p>Email : {customerDetails.email}</p>
                    <p>Phone : {customerDetails.phone}</p>
                    <p>Purpose : {customerDetails.purpose}</p>
                    {customerDetails.notes && (
                      <p>Notes : {customerDetails.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="confirmation-page">
                <div className="confirmation-icon">
                  ✓
                </div>
                <h2>Booking Confirmed !</h2>
                <p className="confirmation-message">Your room has been successfully booked.</p>
                
                <div className="confirmation-card">
                  <h3>Booking Summary</h3>
                  <div className="confirmation-detail">
                    <span>Room</span>
                    <strong>{selectedRoom?.name}</strong>
                  </div>

                  <div className="confirmation-detail">
                    <span>Date</span>
                    <strong>{selectedDate}</strong>
                  </div>

                  <div className="confirmation-detail">
                      <span>Time</span>
                      <strong>{selectedSlot?.time}</strong>
                  </div>

                  <div className="confirmation-detail">
                      <span>Booked By</span>
                      <strong>{customerDetails.fullName}</strong>
                  </div>
                </div>
              </div>
            )}
          </section>

          {currentStep < 5 && (
            <div className="booking-actions">
              {currentStep > 1 && (
                <button className="back-button" onClick={() => setCurrentStep(currentStep - 1)}>Back</button>
              )}
              <button 
              className="next-button" 
              disabled={
                (currentStep === 1 && !selectedRoom) || 
                (currentStep === 2 && (!selectedDate || !selectedSlot)) || 
                (currentStep === 3 && !detailsVerified)}
              onClick={() => setCurrentStep(currentStep + 1)}>Next</button>
            </div>
          )}

        </main>
      </div>
    </>
  );
}

export default App;
