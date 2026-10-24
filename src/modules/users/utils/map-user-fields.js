export const mapUserToResponse = (user) => {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        jobTitle: user.jobTitle,
        bio: user.bio,
        timezone: user.timezone,
        locale: user.locale,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
    };
};
