package com.agrolink.backend.service;

import com.agrolink.backend.model.Profile;
import com.agrolink.backend.model.UserStatus;
import com.agrolink.backend.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ProfileService {

    @Autowired
    private ProfileRepository profileRepository;

    public Profile createProfile(Profile profile) {
        return profileRepository.save(profile);
    }

    public Profile getProfile(UUID id) {
        return profileRepository.findById(id).orElse(null);
    }

    public List<Profile> getPendingProfiles() {
        return profileRepository.findByStatusIn(List.of(UserStatus.pending, UserStatus.submitted));
    }

    public Profile approveProfile(UUID id) {
        Profile profile = getProfile(id);
        if (profile != null) {
            profile.setStatus(UserStatus.approved);
            return profileRepository.save(profile);
        }
        return null;
    }

    public Profile rejectProfile(UUID id) {
        Profile profile = getProfile(id);
        if (profile != null) {
            profile.setStatus(UserStatus.rejected);
            return profileRepository.save(profile);
        }
        return null;
    }
}
