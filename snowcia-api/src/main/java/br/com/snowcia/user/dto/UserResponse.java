package br.com.snowcia.user.dto;

import br.com.snowcia.user.AppUser;

public record UserResponse(Long id, String name, String email, String phone, String address, String role) {
    public static UserResponse from(AppUser user) { return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getAddress(), user.getRoleName()); }
}
