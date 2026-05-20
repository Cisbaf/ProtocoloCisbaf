package com.requerimentosback.admin.controller;

import com.requerimentosback.admin.model.dtos.AdminRequest;
import com.requerimentosback.admin.model.dtos.AdminResponse;
import com.requerimentosback.admin.model.dtos.LoginDTO;
import com.requerimentosback.admin.service.AdminService;
import com.requerimentosback.admin.service.LoginService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.naming.AuthenticationException;
import java.net.URI;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;
    private final LoginService loginService;

    @GetMapping("/{username}")
    public ResponseEntity<AdminResponse> findByUsername(@RequestParam String username) {
        return ResponseEntity.ok(adminService.findByUsername(username));
    }

    @PostMapping("/register")
    public ResponseEntity<AdminResponse> save(@RequestBody AdminRequest request) throws AuthenticationException {

        var admin = adminService.create(request);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").build(admin.id());

        return ResponseEntity.created(uri).build();
    }

    @PostMapping("/login")
    public ResponseEntity<Void> login(@RequestBody LoginDTO login, HttpServletResponse response) throws AuthenticationException {
        loginService.login(login, response);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestParam String id) {
        adminService.delete(id);
        return ResponseEntity.noContent().build();
    }

}
