package com.agrolink.backend.repository;

import com.agrolink.backend.model.Profile;
import com.agrolink.backend.model.UserStatus;
import com.agrolink.backend.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    List<Profile> findByStatus(UserStatus status);

    List<Profile> findByStatusIn(List<UserStatus> statuses);

    List<Profile> findByRoleAndRatingGreaterThanEqual(UserRole role, Double rating);
}
