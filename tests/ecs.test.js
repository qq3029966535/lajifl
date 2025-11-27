/**
 * ECS系统测试
 */
import { Entity } from '../src/js/ecs/Entity.js';
import { Component } from '../src/js/ecs/Component.js';
import { Transform } from '../src/js/ecs/components/Transform.js';
import { ComponentManager } from '../src/js/ecs/ComponentManager.js';

describe('ECS System', () => {
    let entity;
    let componentManager;

    beforeEach(() => {
        entity = new Entity();
        componentManager = new ComponentManager();
    });

    test('Entity should have unique ID', () => {
        const entity1 = new Entity();
        const entity2 = new Entity();
        expect(entity1.id).not.toBe(entity2.id);
    });

    test('Entity should add and get components', () => {
        const transform = new Transform(10, 20);
        entity.addComponent(transform);
        
        expect(entity.hasComponent('Transform')).toBe(true);
        expect(entity.getComponent('Transform')).toBe(transform);
        expect(transform.entity).toBe(entity);
    });

    test('Entity should remove components', () => {
        const transform = new Transform();
        entity.addComponent(transform);
        entity.removeComponent('Transform');
        
        expect(entity.hasComponent('Transform')).toBe(false);
        expect(transform.entity).toBe(null);
    });

    test('Transform component should handle position', () => {
        const transform = new Transform(10, 20);
        
        expect(transform.position.x).toBe(10);
        expect(transform.position.y).toBe(20);
        
        transform.setPosition(30, 40);
        expect(transform.position.x).toBe(30);
        expect(transform.position.y).toBe(40);
        
        transform.translate(5, 5);
        expect(transform.position.x).toBe(35);
        expect(transform.position.y).toBe(45);
    });

    test('ComponentManager should register and query entities', () => {
        const entity1 = new Entity();
        const entity2 = new Entity();
        
        entity1.addComponent(new Transform());
        componentManager.registerEntity(entity1);
        componentManager.registerEntity(entity2);
        
        const entitiesWithTransform = componentManager.getEntitiesWithComponents('Transform');
        expect(entitiesWithTransform).toHaveLength(1);
        expect(entitiesWithTransform[0]).toBe(entity1);
    });

    test('Entity should check multiple components', () => {
        const transform = new Transform();
        entity.addComponent(transform);
        
        expect(entity.hasComponents('Transform')).toBe(true);
        expect(entity.hasComponents('Transform', 'Renderer')).toBe(false);
    });
});