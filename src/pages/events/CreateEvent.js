import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { FaCalendarPlus } from "react-icons/fa";
import { BASE_URL } from "../../constants/API";

export default function CreateEvent() {

  const token = localStorage.getItem("token");

  const [clubs,setClubs] = useState([]);
  const [loading,setLoading] = useState(false);

  const [form,setForm] = useState({
    club_id:"",
    event_name:"",
    description:"",
    rules:"",
    start_datetime:"",
    end_datetime:"",
    registration_open:"",
    registration_close:"",
    is_team_event:false,
    team_size_min:1,
    team_size_max:1,
    max_participants:0
  });

  const update = (k,v)=>setForm(p=>({...p,[k]:v}));

  useEffect(()=>{
    loadClubs();
  },[]);

  const loadClubs = async ()=>{
    try{
      const res = await fetch(`${BASE_URL}/clubs`,{
        headers:{Authorization:`Bearer ${token}`}
      });
      const json = await res.json();
      setClubs(Array.isArray(json)?json:json.data||[]);
    }catch{
      setClubs([]);
    }
  };

  const createEvent = async ()=>{

    if(!form.club_id){
      Swal.fire("Validation","Select club","warning");
      return;
    }

    if(!form.event_name){
      Swal.fire("Validation","Event name required","warning");
      return;
    }

    try{

      setLoading(true);

      const res = await fetch(`${BASE_URL}/events`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },
        body:JSON.stringify(form)
      });

      const json = await res.json();

      if(json.success){
        Swal.fire("Success","Event created","success");
      }else{
        throw new Error();
      }

    }catch{
      Swal.fire("Error","Failed to create event","error");
    }finally{
      setLoading(false);
    }

  };

  return (

    <div className="p-6 bg-[#F8FAFC] min-h-screen">

      <div className="max-w-3xl mx-auto">

        <motion.div
          initial={{scale:0.95}}
          animate={{scale:1}}
          className="bg-white rounded-2xl shadow p-8 space-y-5"
        >

          <div className="flex items-center gap-3 mb-4">
            <FaCalendarPlus className="text-indigo-600"/>
            <h2 className="text-xl font-bold">Create Event</h2>
          </div>

          <select
            className="w-full border rounded-xl px-4 py-3"
            value={form.club_id}
            onChange={e=>update("club_id",e.target.value)}
          >
            <option value="">Select Club</option>
            {clubs.map(c=>(
              <option key={c.club_id} value={c.club_id}>
                {c.club_name}
              </option>
            ))}
          </select>

          <input
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Event Name"
            value={form.event_name}
            onChange={e=>update("event_name",e.target.value)}
          />

          <textarea
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Description"
            value={form.description}
            onChange={e=>update("description",e.target.value)}
          />

          <textarea
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Rules"
            value={form.rules}
            onChange={e=>update("rules",e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-sm text-gray-500">Start</label>
              <input
                type="datetime-local"
                className="w-full border rounded-xl px-4 py-3"
                value={form.start_datetime}
                onChange={e=>update("start_datetime",e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">End</label>
              <input
                type="datetime-local"
                className="w-full border rounded-xl px-4 py-3"
                value={form.end_datetime}
                onChange={e=>update("end_datetime",e.target.value)}
              />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-sm text-gray-500">Registration Open</label>
              <input
                type="datetime-local"
                className="w-full border rounded-xl px-4 py-3"
                value={form.registration_open}
                onChange={e=>update("registration_open",e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Registration Close</label>
              <input
                type="datetime-local"
                className="w-full border rounded-xl px-4 py-3"
                value={form.registration_close}
                onChange={e=>update("registration_close",e.target.value)}
              />
            </div>

          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_team_event}
              onChange={e=>update("is_team_event",e.target.checked)}
            />
            Team Event
          </label>

          {form.is_team_event && (

            <div className="grid grid-cols-2 gap-4">

              <input
                type="number"
                placeholder="Team Min"
                className="border rounded-xl px-4 py-3"
                value={form.team_size_min}
                onChange={e=>update("team_size_min",e.target.value)}
              />

              <input
                type="number"
                placeholder="Team Max"
                className="border rounded-xl px-4 py-3"
                value={form.team_size_max}
                onChange={e=>update("team_size_max",e.target.value)}
              />

            </div>

          )}

          <input
            type="number"
            placeholder="Max Participants"
            className="w-full border rounded-xl px-4 py-3"
            value={form.max_participants}
            onChange={e=>update("max_participants",e.target.value)}
          />

          <button
            onClick={createEvent}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700"
          >
            {loading?"Creating...":"Create Event"}
          </button>

        </motion.div>

      </div>

    </div>
  );
}