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
  const [guest, setGuests] = useState(1);
  const [createdBooking, setCreatedBooking] = useState(null);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

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
    if (!selectedRoom || !selectedDate){
      setSlots([]);
      setSelectedSlot(null);
      setSlotLoading(false);
      setSlotError("");
      return
    }

    async function fetchSlots() {
      setSlotLoading(true);
      setSlotError("");
      setSelectedSlot(null);

      try {
        const slotsResponse = await fetch(`http://localhost:3001/slots?roomId=${selectedRoom.id}`);

        if (!slotsResponse.ok){
          throw new Error("Failed to fetch time slots.");
        }

        const slotsData = await slotsResponse.json();
        
        const bookingResponse = await fetch(`http://localhost:3001/bookings?roomId=${selectedRoom.id}&date=${selectedDate}`)
        if(!bookingResponse.ok){
          throw new Error("Failed to fetch bookings")
        }
        
        const bookingsData = await bookingResponse.json();

        const updatedSlots = slotsData.map((slot) => {
          const isBooked = bookingsData.some(
            (booking) => 
              Number(booking.roomId) === Number(selectedRoom.id) &&
              Number(booking.slotId) === Number(slot.id) &&
              booking.date === selectedDate
          )
          return{...slot, isAvailable: slot.isAvailable && !isBooked}
        })
        setSlots(updatedSlots);
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
  }, [selectedRoom, selectedDate]);

  function verifyDetails(){
    const {fullName, email, phone, purpose} = customerDetails;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = phone.replace(/[\s()+-]/g, "");

    if(!fullName.trim() || !email.trim() || !phone.trim() || !purpose.trim()){
      setDetailsVerified(false);
      alert("Please fill all required fields.");
      return false;
    }

    if(!emailPattern.test(email.trim())){
      setDetailsVerified(false);
      alert("Please enter a valid email address.");
      return false;
    }

    if(!/^\d{10,15}$/.test(phoneDigits)){
      setDetailsVerified(false);
      alert("Enter a valid phone number with 10-15 digits.")
      return false;
    }

    if(!selectedRoom || Number(guest) < 1 || Number(guest) > Number(selectedRoom.capacity)){
      setDetailsVerified(false);
      alert(`Guests must be between 1 and ${selectedRoom?.capacity ?? 0}.`);
      return false;
    }

    setDetailsVerified(true);
    return true;
  }

  async function createBooking() {
    const isValid = verifyDetails()

    if(!isValid){
      return
    }

    if(!selectedRoom || !selectedDate || !selectedSlot){
      alert("Plese select a room, date, and time slot.")
      return;
    }
    setBookingLoading(true);
    setBookingError("");

    try {
      const response = await fetch("http://localhost:3001/bookings", {
        method: "POST", headers: {"Content-Type" : "application/json"},
        body: JSON.stringify({
          roomId: Number(selectedRoom.id),
          slotId: Number(selectedSlot.id),
          date: selectedDate,
          name: customerDetails.fullName.trim(),
          email: customerDetails.email.trim(),
          phone: customerDetails.phone.trim(),
          participants: Number(guest),
          purpose: customerDetails.purpose.trim(),
          notes: customerDetails.notes.trim()
        })
      })

      if(!response.ok){
        setBookingError("Booking failed. Try again.")
        return;
      }

      const booking = await response.json();
      setCreatedBooking(booking);
      setCurrentStep(5);
    }
    catch (error){
      console.log("Booking error: ", error)
      setBookingError("Can't connect to the booking API.")
    }
    finally{
      setBookingLoading(false);
    }
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
              </div>

              <div className="rooms-avail">
                <p>Available rooms : ({rooms.length})</p>
                {loading ? (<p>Loading rooms...</p>) : error ? (<p>{error}</p>) : rooms.length === 0 ? (<p>No rooms available.</p>) : (
                  <div className="room-cards">
                    {rooms.map((room) => (
                      <div key={room.id} className={`room-x ${selectedRoom?.id === room.id ? "selected" : ""}`} onClick={() => {setSelectedRoom(room); setSelectedDate(""); setSelectedSlot(null); setSlots([])}}>
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
                    onChange={(e) => {setSelectedDate(e.target.value); setSelectedSlot(null)}}/>
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
                  <form className="details-form" onSubmit={(e) => {e.preventDefault(); verifyDetails()}}>
                    <h3>Contact Information</h3>
                    <p className="form-hint">* Required Fields</p>
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name *</label>
                      <input type="text" id="fullName" placeholder="Enter your full name" value={customerDetails.fullName} onChange={(e) => {setCustomerDetails({...customerDetails, fullName: e.target.value}); setDetailsVerified(false)}} required />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input type="email" id="email" placeholder="abc@gmail.com" value={customerDetails.email} onChange={(e) => {setCustomerDetails({...customerDetails, email: e.target.value}); setDetailsVerified(false)}} required/>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input type="tel" id="phone" placeholder="Enter your phone number" value={customerDetails.phone} onChange={(e) => {setCustomerDetails({...customerDetails, phone: e.target.value}); setDetailsVerified(false)}} required/>
                    </div>

                    <div className="form-group">
                      <label htmlFor="guest">Number of Guest *</label>
                      <input type="number" id="guest" min="1" max={selectedRoom?.capacity || 1} value={guest} onChange={(e) => {setGuests(e.target.value); setDetailsVerified(false)}} required />
                    </div>

                    <div className="form-group">
                      <label htmlFor="purpose">Purpose of Booking *</label>
                      <input type="text" id="purpose" placeholder="e.g. Team meeting, project discussion" value={customerDetails.purpose} onChange={(e) => {setCustomerDetails({...customerDetails, purpose: e.target.value}); setDetailsVerified(false)}} required/>
                    </div>

                    <div className="form-group">
                      <label htmlFor="notes">Additional Notes</label>
                      <input type="text" id="notes" placeholder="Any special requests ?" value={customerDetails.notes} onChange={(e) => setCustomerDetails({...customerDetails, notes: e.target.value})}/>
                    </div>

                    <button type="submit" className={`verify-details ${detailsVerified ? "verified" : ""}`}>
                      {detailsVerified ? "Verified" : "Verify Details"}
                    </button>
                  </form>
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
                <p>Booking Code : <strong>#{createdBooking?.id}</strong></p>
                <div className="confirmation-card">
                  <h3>Booking Summary</h3>
                  <div className="confirmation-detail">
                    <span>Room</span>
                    <strong>{selectedRoom?.name}</strong>
                  </div>

                  <div className="confirmation-detail">
                    <span>Guest</span>
                    <strong>{guest}</strong>
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
              {bookingError && (
                <p className="error-message">{bookingError}</p>
              )}
              {currentStep > 1 && (
                <button className="back-button" onClick={() => setCurrentStep(currentStep - 1)}>Back</button>
              )}
              <button 
              className="next-button" 
              disabled={
                bookingLoading ||
                (currentStep === 1 && !selectedRoom) || 
                (currentStep === 2 && (!selectedDate || !selectedSlot)) || 
                (currentStep === 3 && !detailsVerified)}
              onClick={() => {
                if(currentStep === 4) {
                  createBooking()
                }
                else{
                  setCurrentStep(currentStep + 1)
                }}}
              >{currentStep === 4 ? "Confirm Booking" : "Next"}</button>
            </div>
          )}

        </main>
      </div>
    </>
  );
}

export default App;
