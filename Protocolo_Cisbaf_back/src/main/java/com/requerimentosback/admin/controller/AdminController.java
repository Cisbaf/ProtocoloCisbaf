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
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;
    private final LoginService loginService;

    @GetMapping("/me")
    public ResponseEntity<AdminResponse> findCurrent(Principal principal) {
        return ResponseEntity.ok(adminService.findCurrent(principal));
    }

    @GetMapping
    public ResponseEntity<List<AdminResponse>> findAll(Principal principal) {
        return ResponseEntity.ok(adminService.findAll(principal));
    }

    @GetMapping("/{username}")
    public ResponseEntity<AdminResponse> findByUsername(@PathVariable String username) {
        return ResponseEntity.ok(adminService.findByUsername(username));
    }

    @PostMapping("/register")
    public ResponseEntity<AdminResponse> save(@RequestBody AdminRequest request, Principal principal) {
        var admin = adminService.create(request, principal);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").build(admin.id());

        return ResponseEntity.created(uri).body(admin);
    }

    @PutMapping("/{username}")
    public ResponseEntity<AdminResponse> update(
            @PathVariable String username,
            @RequestBody AdminRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(adminService.update(username, request, principal));
    }

    @PostMapping("/login")
    public ResponseEntity<Void> login(@RequestBody LoginDTO login, HttpServletResponse response) throws AuthenticationException {
        try {
            loginService.login(login, response);
            return ResponseEntity.status(HttpStatus.ACCEPTED).build();
        }catch (Exception e){
            throw new AuthenticationException(e.getMessage());
        }
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<Void> delete(@PathVariable String username, Principal principal) {
        adminService.delete(username, principal);
        return ResponseEntity.noContent().build();
    }

}
