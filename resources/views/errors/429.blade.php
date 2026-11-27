@extends('errors.layout')
@section('code', '429')
@section('title', app()->getLocale() === 'ar' ? 'طلبات كثيرة جدًا' : 'Too Many Requests')
@section('message', app()->getLocale() === 'ar' ? 'يرجى الانتظار قليلًا ثم إعادة المحاولة.' : 'Too many requests. Please wait a moment and try again.')
