"use client";
import React, { useState } from 'react';
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

  const handleSave = () => {
    alert('Profile saved! (Frontend mockup)');
    console.log(profile);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-0 pt-16">
      <div className="w-screen h-full bg-white flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/3 bg-gray-100 p-6 flex flex-col items-center space-y-4">
          <div className="relative group">
            <img
              src={profile.avatar || 'https://via.placeholder.com/120?text=Avatar'}
              alt="Avatar"
              className="w-32 h-32 rounded-full border-4 border-white shadow"
            />
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
              <input
                name="fullName"
                placeholder="Full Name"
                className="p-3 border rounded focus:ring focus:ring-gray-200"
                value={profile.fullName}
                onChange={handleChange}
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="p-3 border rounded focus:ring focus:ring-gray-200"
                value={profile.email}
                onChange={handleChange}
              />
              <input
                name="username"
                placeholder="Username"
                className="p-3 border rounded focus:ring focus:ring-gray-200"
                value={profile.username}
                onChange={handleChange}
              />
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full p-3 border rounded focus:ring focus:ring-gray-200"
                  value={profile.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
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
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number"
                className="p-3 border rounded focus:ring focus:ring-gray-200"
                value={profile.phone}
                onChange={handleChange}
              />
              <input
                name="grade"
                placeholder="Grade"
                className="p-3 border rounded focus:ring focus:ring-gray-200"
                value={profile.grade}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Personalization */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Personalization</h3>
            <textarea
              name="bio"
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full p-3 border rounded focus:ring focus:ring-gray-200 resize-y"
              value={profile.bio}
              onChange={handleChange}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <input
                name="learningStyle"
                placeholder="Learning Style"
                className="p-3 border rounded focus:ring focus:ring-gray-200"
                value={profile.learningStyle}
                onChange={handleChange}
              />
              <input
                name="learningNeeds"
                placeholder="Learning Needs"
                className="p-3 border rounded focus:ring focus:ring-gray-200"
                value={profile.learningNeeds}
                onChange={handleChange}
              />
              <input
                name="interests"
                placeholder="Interests"
                className="p-3 border rounded focus:ring focus:ring-gray-200"
                value={profile.interests}
                onChange={handleChange}
              />
              <input
                name="dreamJob"
                placeholder="Dream Job"
                className="p-3 border rounded focus:ring focus:ring-gray-200"
                value={profile.dreamJob}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="text-right">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-gray-800 text-white font-semibold rounded hover:bg-gray-900 transition"
            >
              💾 Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
