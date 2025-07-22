"use client";
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    avatar: '',
    fullName: '',
    nickname: '',
    dob: '',
    phone: '',
    grade: '',
    learningNeeds: '',
    learningStyle: '',
    interests: '',
    dreamJob: '',
    email: '',
    username: '',
    password: '',
    bio: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const requiredFields = [
    { name: 'fullName', label: 'Full Name' },
    { name: 'email', label: 'Email' },
    { name: 'username', label: 'Username' },
  ];
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('PRIV-05_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setProfile((prev) => ({
            ...prev,
            fullName: parsed.name || '',
            email: parsed.email || '',
            username: parsed.username || '',
            grade: parsed.grade || '',
          }));
        } catch (e) {
          // ignore parse error
        }
      }
    }
  }, []);

  const handleChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfile({ ...profile, avatar: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // 获取 user_id
    let user_id = null;
    let user_obj = null;
    if (typeof window !== 'undefined') {
      try {
        let user = null;
        if (sessionStorage.getItem('user')) {
          user = JSON.parse(sessionStorage.getItem('user'));
        } else if (localStorage.getItem('user')) {
          user = JSON.parse(localStorage.getItem('user'));
        }
        user_id = user?.id;
        user_obj = user;
        console.log('user_id', user_id, 'user_obj:', user, 'session:', sessionStorage.getItem('user'), 'local:', localStorage.getItem('user'));
      } catch {}
    }
    if (!user_id && !(user_obj && user_obj.username)) {
      alert('User not logged in.');
      return;
    }

    try {
      const response = await fetch('https://example.com/api/update_profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user_id || undefined,
          user_key: user_obj?.username || undefined,
          ...profile,
        }),
      });
      if (!response.ok) throw new Error('Failed to save profile');
      alert('Profile saved successfully!');
    } catch (err) {
      alert('Failed to save profile: ' + err.message);
    }
  };

  function validate() {
    const newErrors = {};
    requiredFields.forEach((field) => {
      if (!profile[field.name] || profile[field.name].trim() === '') {
        newErrors[field.name] = `${field.label} is required.`;
      }
    });
    // Email format
    if (profile.email && !/^\S+@\S+\.\S+$/.test(profile.email)) {
      newErrors.email = 'Invalid email format.';
    }
    // Phone (optional, but if filled, check format)
    if (profile.phone && !/^\+?\d{7,15}$/.test(profile.phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = 'Invalid phone number.';
    }
    return newErrors;
  }

  
  const getPersonalizedPreview = () => {
    const { fullName, grade, learningStyle, interests, dreamJob } = profile;
    let lecture = '';
    let problem = '';

 
    if (grade?.toLowerCase().includes('algebra')) {
      lecture = `Hi${fullName ? ' ' + fullName : ''}! Let's tackle some Algebra! As a${learningStyle ? ' ' + learningStyle : ''} learner, I'll use more ${learningStyle || 'visual'} aids.`;
    } else if (grade?.toLowerCase().includes('calculus')) {
      lecture = `Hi${fullName ? ' ' + fullName : ''}! Welcome to Calculus! We'll break down concepts step by step.`;
    } else if (grade?.toLowerCase().includes('7') || grade?.toLowerCase().includes('8')) {
      lecture = `Hi${fullName ? ' ' + fullName : ''}! Let's explore math with fun, real-life examples for grade ${grade}.`;
    } else {
      lecture = `Hi${fullName ? ' ' + fullName : ''}! Let's explore math in a way that fits your style!`;
    }

  
    if (interests?.toLowerCase().includes('basketball')) {
      problem = `You love basketball! If you score 2 points per shot and make 7 shots, how many points do you score in total?`;
    } else if (interests?.toLowerCase().includes('coding')) {
      problem = `As a coding fan: If a program runs 3 times faster after optimization, how long will it take to finish a task that used to take 30 minutes?`;
    } else if (interests?.toLowerCase().includes('space')) {
      problem = `If a rocket travels 8,000 km per hour, how far does it go in 3 hours?`;
    } else if (interests?.toLowerCase().includes('video game')) {
      problem = `In your favorite video game, you earn 50 coins per quest. How many coins after 6 quests?`;
    } else if (interests?.toLowerCase().includes('robot')) {
      problem = `If your robot moves 5 meters every minute, how far will it go in 12 minutes?`;
    } else {
      problem = `If a train travels 5 km every 10 minutes, how far will it go in 1 hour?`;
    }

  
    if (learningStyle?.toLowerCase().includes('visual')) {
      lecture += ' I will include diagrams and visual explanations.';
    } else if (learningStyle?.toLowerCase().includes('hands-on')) {
      lecture += ' Let’s try interactive, hands-on activities!';
    } else if (learningStyle?.toLowerCase().includes('verbal')) {
      lecture += ' I will use clear, step-by-step verbal explanations.';
    } else if (learningStyle?.toLowerCase().includes('exploratory')) {
      lecture += ' We will discover patterns together through exploration!';
    }

    
    if (dreamJob) {
      lecture += ` This will help you on your path to becoming a ${dreamJob}.`;
      problem += ` (Great practice for a future ${dreamJob}!)`;
    }

    return { lecture, problem };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-0 pt-16">
      <div className="w-screen h-full bg-white flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/3 bg-gray-100 p-6 flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600 border-4 border-white shadow overflow-hidden">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                "Avatar"
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="absolute inset-0 opacity-0 cursor-pointer rounded-full"
            />
            <div className="absolute bottom-2 right-2 bg-gray-600 text-white p-1 rounded-full shadow group-hover:scale-110 transition">
              ✎
            </div>
          </div>
          <h2 className="text-xl font-bold">{profile.fullName || 'Your Name'}</h2>
          <p className="text-sm text-gray-700">@{profile.nickname || 'nickname'}</p>
          <div className="text-sm text-gray-600 text-center">
            {profile.grade && <div>Grade: {profile.grade}</div>}
            {profile.phone && <div>📞 {profile.phone}</div>}
            {profile.dob && <div>🎂 {profile.dob}</div>}
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Account Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Account Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <input
                  name="fullName"
                  placeholder="e.g. Alice Zhang"
                  className={`p-3 border rounded focus:ring focus:ring-gray-200 ${errors.fullName ? 'border-red-500' : ''}`}
                  value={profile.fullName}
                  onChange={handleChange}
                />
                {errors.fullName && <span className="text-red-500 text-xs mt-1">{errors.fullName}</span>}
              </div>
              <div className="flex flex-col">
                <input
                  name="email"
                  type="email"
                  placeholder="e.g. alice@email.com"
                  className={`p-3 border rounded focus:ring focus:ring-gray-200 ${errors.email ? 'border-red-500' : ''}`}
                  value={profile.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email}</span>}
              </div>
              <div className="flex flex-col">
                <input
                  name="username"
                  placeholder="e.g. math_wizard"
                  className={`p-3 border rounded focus:ring focus:ring-gray-200 ${errors.username ? 'border-red-500' : ''}`}
                  value={profile.username}
                  onChange={handleChange}
                />
                {errors.username && <span className="text-red-500 text-xs mt-1">{errors.username}</span>}
              </div>
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                  onClick={() => setShowChangePassword(true)}
                >
                  Change Password
                </button>
              </div>
            </div>
            {showChangePassword && (
              <div className="mt-2 text-sm text-blue-600">Change password feature coming soon.</div>
            )}
          </div>

          {/* Personal Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Personal Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                name="dob"
                type="date"
                className="p-3 border rounded focus:ring focus:ring-gray-200"
                value={profile.dob}
                onChange={handleChange}
              />
              <div className="flex flex-col">
                <input
                  name="phone"
                  type="tel"
                  placeholder="e.g. +1234567890"
                  className={`p-3 border rounded focus:ring focus:ring-gray-200 ${errors.phone ? 'border-red-500' : ''}`}
                  value={profile.phone}
                  onChange={handleChange}
                />
                {errors.phone && <span className="text-red-500 text-xs mt-1">{errors.phone}</span>}
              </div>
              <div className="flex flex-col">
                <input
                  name="grade"
                  placeholder="e.g. Algebra I"
                  className={`p-3 border rounded focus:ring focus:ring-gray-200 ${errors.grade ? 'border-red-500' : ''}`}
                  value={profile.grade}
                  onChange={handleChange}
                />
                {errors.grade && <span className="text-red-500 text-xs mt-1">{errors.grade}</span>}
              </div>
            </div>
          </div>

          {/* Personalization */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Personalization</h3>
            <textarea
              name="bio"
              placeholder="e.g. I love math puzzles!"
              rows={3}
              className="w-full p-3 border rounded focus:ring focus:ring-gray-200 resize-y"
              value={profile.bio}
              onChange={handleChange}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col">
                <input
                  name="learningStyle"
                  placeholder="e.g. visual"
                  className={`p-3 border rounded focus:ring focus:ring-gray-200 ${errors.learningStyle ? 'border-red-500' : ''}`}
                  value={profile.learningStyle}
                  onChange={handleChange}
                />
                {errors.learningStyle && <span className="text-red-500 text-xs mt-1">{errors.learningStyle}</span>}
              </div>
              <div className="flex flex-col">
                <input
                  name="learningNeeds"
                  placeholder="e.g. step-by-step"
                  className={`p-3 border rounded focus:ring focus:ring-gray-200 ${errors.learningNeeds ? 'border-red-500' : ''}`}
                  value={profile.learningNeeds}
                  onChange={handleChange}
                />
                {errors.learningNeeds && <span className="text-red-500 text-xs mt-1">{errors.learningNeeds}</span>}
              </div>
              <div className="flex flex-col">
                <input
                  name="interests"
                  placeholder="e.g. robotics"
                  className={`p-3 border rounded focus:ring focus:ring-gray-200 ${errors.interests ? 'border-red-500' : ''}`}
                  value={profile.interests}
                  onChange={handleChange}
                />
                {errors.interests && <span className="text-red-500 text-xs mt-1">{errors.interests}</span>}
              </div>
              <div className="flex flex-col">
                <input
                  name="dreamJob"
                  placeholder="e.g. engineer"
                  className={`p-3 border rounded focus:ring focus:ring-gray-200 ${errors.dreamJob ? 'border-red-500' : ''}`}
                  value={profile.dreamJob}
                  onChange={handleChange}
                />
                {errors.dreamJob && <span className="text-red-500 text-xs mt-1">{errors.dreamJob}</span>}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex flex-col items-end">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-gray-800 text-white font-semibold rounded hover:bg-gray-900 transition"
            >
              💾 Save Profile
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="mt-4 px-6 py-3 bg-gray-800 text-white font-semibold rounded hover:bg-gray-900 transition"
            >
              Preview how this affects your content
            </button>
          </div>
        </div>
      </div>
      
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in-card">
            <h2 className="text-2xl font-bold mb-4 text-center">Personalized Content Preview</h2>
            <div className="mb-6 text-gray-600 text-sm text-left">
              <strong>How your profile affects content:</strong><br/>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Lecture tone: more examples, simpler language, or slower explanations</li>
                <li>Interests: embed your hobbies (e.g., sports, coding) into explanations</li>
                <li>Difficulty: adapt problem format and challenge to your grade/level</li>
                <li>Learning style: use analogies and methods that fit your preferences</li>
                <li>Career: relate examples and problems to your dream job</li>
              </ul>
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-1">Lecture Example:</div>
              <div className="bg-gray-100 rounded p-3 text-gray-800 text-sm whitespace-pre-line">{getPersonalizedPreview().lecture}</div>
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-1">Problem Example:</div>
              <div className="bg-gray-100 rounded p-3 text-gray-800 text-sm whitespace-pre-line">{getPersonalizedPreview().problem}</div>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="mt-4 px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
              Close
            </button>
          </div>
          <style jsx global>{`
            @keyframes fadeInCard {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in-card { animation: fadeInCard 0.3s; }
          `}</style>
        </div>
      )}
    </div>
  );
}
